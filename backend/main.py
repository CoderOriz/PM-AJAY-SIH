"""PM-AJAY backend: sessions, profiles, scored recommendations, aggregate admin stats (C3)."""
import hashlib
import json
import math
import os
import sqlite3
import uuid
import zlib
from collections import Counter
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB = os.path.join(os.path.dirname(__file__), "pmajay.db")
RESUME_WINDOW = timedelta(hours=48)  # C4: phone number is the session key, no PIN
SALT = "pmajay-demo-salt"  # ponytail: fixed demo salt; env-provided secret before real data

app = FastAPI(title="PM-AJAY Voice Livelihood Assistant")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])  # ponytail: wide-open CORS, demo only


@contextmanager
def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def phone_hash(phone: str) -> str:
    """C3: one-way hash; raw phone number is never stored."""
    return hashlib.sha256((SALT + phone.strip()).encode()).hexdigest()


class SessionIn(BaseModel):
    phone: str


class ProfileIn(BaseModel):
    slots: dict


# C3/trust boundary: unknown keys dropped at ingest
ALLOWED_SLOTS = {
    "district_lgd", "district_name", "education_grade", "primary_interest",
    "language", "mobility_constraint", "preference", "family_occupation",
    "nearest_market", "consent_given", "assisted_session", "operator_id",
}


@app.post("/session")
def create_session(body: SessionIn):
    """Create a session keyed by phone hash. Auto-resumes within 48h (C4)."""
    ph = phone_hash(body.phone)
    now = datetime.now(timezone.utc).isoformat()
    with db() as conn:
        row = conn.execute(
            "SELECT id, state_json, updated_at FROM sessions WHERE phone_hash=? "
            "ORDER BY updated_at DESC LIMIT 1", (ph,)).fetchone()
        if row and datetime.fromisoformat(row["updated_at"]) > datetime.now(timezone.utc) - RESUME_WINDOW:
            return {"session_id": row["id"], "resumed": True,
                    "confirmed_slots": json.loads(row["state_json"] or "{}")}
        sid = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO sessions (id, phone_hash, created_at, updated_at, state_json) VALUES (?,?,?,?,?)",
            (sid, ph, now, now, "{}"))
        return {"session_id": sid, "resumed": False, "confirmed_slots": {}}


EDU_LEVELS = (0, 5, 8, 10, 12, 15)


def _anomaly_flagged(conn, session_id, new_state):
    """H9: cross-session consistency — education jumps >=2 levels or interest-group change.
    ponytail: interest string compare only; taxonomy-aware check when NER (F2.2) lands."""
    row = conn.execute("SELECT phone_hash FROM sessions WHERE id=?", (session_id,)).fetchone()
    if not row:
        return False
    priors = conn.execute(
        "SELECT state_json FROM sessions WHERE phone_hash=? AND id<>? AND state_json<>'{}'",
        (row["phone_hash"], session_id)).fetchall()
    edu, interest = new_state.get("education_grade"), (new_state.get("primary_interest") or "").lower().strip()
    for p in priors:
        old = json.loads(p["state_json"] or "{}")
        old_edu, old_int = old.get("education_grade"), (old.get("primary_interest") or "").lower().strip()
        if isinstance(edu, int) and isinstance(old_edu, int) and edu in EDU_LEVELS and old_edu in EDU_LEVELS \
                and abs(EDU_LEVELS.index(edu) - EDU_LEVELS.index(old_edu)) >= 2:
            return True
        if interest and old_int and interest != old_int:
            return True
    return False


@app.post("/session/{session_id}/profile")
def ingest_profile(session_id: str, body: ProfileIn):
    """Slot-filling ingest: merges confirmed slots, persisted after every slot (H5)."""
    updates = {k: v for k, v in body.slots.items() if k in ALLOWED_SLOTS}
    with db() as conn:
        if updates.get("assisted_session"):  # H6: kiosk certification gate
            try:
                op_id = int(updates.get("operator_id") or -1)
            except (TypeError, ValueError):
                op_id = -1
            op = conn.execute("SELECT certified FROM operators WHERE id=?", (op_id,)).fetchone()
            if not op or not op["certified"]:
                raise HTTPException(403, "operator not certified")
        row = conn.execute("SELECT state_json FROM sessions WHERE id=?", (session_id,)).fetchone()
        if not row:
            raise HTTPException(404, "session not found")
        state = json.loads(row["state_json"] or "{}")
        state.update(updates)
        if _anomaly_flagged(conn, session_id, state):
            state["anomaly_flag"] = True  # H9: flag for human review; profile stays advisory
        conn.execute(
            "UPDATE sessions SET state_json=?, updated_at=? WHERE id=?",
            (json.dumps(state, ensure_ascii=False), datetime.now(timezone.utc).isoformat(), session_id))
        return {"session_id": session_id, "profile": state}


# --- Day 3 scorer helpers ---
# Pune-area coords for nearest_market matching. ponytail: static demo table; geocoding/PostGIS at pilot scale.
MARKETS = {"hadapsar": (18.5018, 73.9268), "kothrud": (18.5070, 73.8070), "swargate": (18.5010, 73.8600),
           "pimpri": (18.6200, 73.8000), "chinchwad": (18.6290, 73.8100), "yerawada": (18.5520, 73.8800),
           "aundh": (18.5630, 73.8070), "kharadi": (18.5450, 73.9400), "wagholi": (18.5770, 73.9600),
           "hinjewadi": (18.5910, 73.7390), "katraj": (18.4510, 73.8620), "dhankawadi": (18.4700, 73.8500),
           "bibwewadi": (18.4660, 73.8560), "nigdi": (18.6400, 73.7850), "akurdi": (18.6330, 73.7880),
           "dapodi": (18.6020, 73.7950), "vishrantwadi": (18.5570, 73.8720), "chandan nagar": (18.5530, 73.9010),
           "market yard": (18.4830, 73.8600), "sinhagad road": (18.4700, 73.8200)}
PUNE_CENTER = (18.5204, 73.8567)

# ponytail: English-keyword synonyms only; multilingual NER (F2.2) when voice Marathi input matters.
SYNONYMS = {
    "tailoring": ["tailor", "sewing", "stitch", "embroider", "garment", "fashion", "dress", "apparel", "made-up", "fabric"],
    "farming": ["agri", "nursery", "dairy", "poultry", "greenhouse", "organic", "farm", "seed", "fisheries", "goat", "bee", "crop"],
    "carpentry": ["carpenter", "mason", "bar bender", "shuttering", "scaffold", "formwork", "pop", "tile", "painter", "waterproof", "construction", "plumber", "electrician"],
    "beauty": ["beauty", "hair", "makeup", "mehendi", "spa", "nail", "salon", "facial"],
    "mobile repair": ["mobile", "laptop", "electronics", "cctv", "inverter", "solar", "tv ", "appliance"],
    "shop": ["retail", "store", "cashier", "kirana", "merchandiser", "inventory", "warehouse", "delivery", "sales", "seller"],
    "weaving": ["weaver", "loom", "handloom", "textile", "block print", "dye", "saree", "handicraft"],
}


def _haversine_km(a, b):
    r = 6371.0
    la1, lo1, la2, lo2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(h)), 1)


def _market_coords(name):
    n = (name or "").lower()
    for k, c in MARKETS.items():
        if k in n or n in k:
            return c
    return PUNE_CENTER


def _edu_min(s):
    return {"Class 5": 5, "Class 8": 8, "Class 10": 10, "Class 12": 12}.get(s, 0)


def _aspiration(interest, title):
    t = title.lower()
    if interest:
        if any(w in t for w in interest.split()) or any(s in t for s in SYNONYMS.get(interest, [])):
            return 1.0
    return 0.15


def _nearest_centre(conn, code, district, origin):
    """Nearest active centre offering this QP; prefers fresh (<=30 days) over stale (C6)."""
    rows = conn.execute(
        "SELECT * FROM centres WHERE district_lgd=? AND status='active' AND qp_codes LIKE ?",
        (district, f"%{code}%")).fetchall()
    if not rows:
        return None, None, False
    today = date.today()

    ranked = sorted(((_haversine_km(origin, (r["lat"], r["lng"])),
                      (today - date.fromisoformat(r["last_verified"])).days > 30, r) for r in rows),
                    key=lambda t: (t[1], t[0]))
    km, stale, best = ranked[0]
    centre = {k: best[k] for k in ("name", "phone", "lat", "lng", "last_verified")}
    return centre, km, stale


def _coordinator(sector):
    """H4: SSC assessment coordinator phone per sector. ponytail: deterministic placeholder;
    seed real SSC/RSETI contacts at pilot."""
    return f"020-27{zlib.crc32(sector.encode()) % 1000000:06d}"


def _rec_card(s):
    qp = s["qp"]
    gap = "zero" if s["cap"] >= 1.0 else "partial" if s["cap"] >= 0.6 else "major"  # B2.1 classifier
    card = {"qp_code": qp["code"], "title": qp["title"], "sector": qp["sector"],
            "nsqf_level": qp["nsqf_level"], "duration_months": qp["duration_months"],
            "physical_req": qp["physical_req"],
            "scheme": qp["scheme_flags"], "fit_score": round(s["score"], 2),
            "gap": gap,
            # B2.2 dropout-risk. ponytail: heuristic (long course + major gap); real data at pilot
            "dropout_risk": "high" if qp["duration_months"] >= 12 and gap == "major" else "low",
            "pinned": s["pinned"],  # H3: shown with district-office label
            "distance_km": s["km"], "centre_stale": s["stale"], "centre": s["centre"]}
    if s.get("rpl"):  # H4: RPL handoff with SSC coordinator contact + RSETI referral
        card["rpl"] = {"coordinator": _coordinator(qp["sector"]),
                       "note": "RSETI referral sent — family occupation matches this trade"}
    return card


@app.get("/session/{session_id}/recommendations")
def recommendations(session_id: str):
    """Day 3 scorer: aspiration 40 / capability 30 / access 20 / scheme 10.
    ponytail: no local-demand axis in demo (no job-posting data); add when NCS feed lands (B1.2)."""
    with db() as conn:
        row = conn.execute("SELECT state_json FROM sessions WHERE id=?", (session_id,)).fetchone()
        if not row:
            raise HTTPException(404, "session not found")
        state = json.loads(row["state_json"] or "{}")
        interest = (state.get("primary_interest") or "").lower().strip()
        edu = int(state.get("education_grade") or 0)
        mobile = bool(state.get("mobility_constraint"))
        district = state.get("district_lgd") or "523"
        origin = _market_coords(state.get("nearest_market"))
        pinned = {r["qp_code"] for r in conn.execute(
            "SELECT qp_code FROM pinned_courses WHERE district_lgd=?", (district,))}  # H3
        fam = (state.get("family_occupation") or "").lower().strip()  # H4 RPL source
        scored = []
        for qp in conn.execute("SELECT * FROM qps").fetchall():
            if mobile and qp["physical_req"] != "None":
                continue  # B2.1: never recommend a QP the beneficiary cannot physically meet
            title = qp["title"].lower()
            asp = _aspiration(interest, qp["title"])
            need = _edu_min(qp["min_education"])
            cap = 1.0 if edu >= need else 0.6 if edu >= need - 3 else 0.2
            centre, km, stale = _nearest_centre(conn, qp["code"], district, origin)
            access = max(0.0, 1 - (km or 50) / 50)
            scheme = 1.0 if "PM-AJAY GIA" in qp["scheme_flags"] else 0.8 if "PMKVY" in qp["scheme_flags"] else 0.5
            score = 0.4 * asp + 0.3 * cap + 0.2 * access + 0.1 * scheme
            if qp["code"] in pinned:
                score += 0.15  # H3: nodal-officer pin boosts rank
            rpl = bool(fam) and (any(w in title for w in fam.split())
                                 or any(s in title for s in SYNONYMS.get(fam, [])))
            scored.append({"qp": qp, "score": score, "asp": asp, "cap": cap,
                           "centre": centre, "km": km, "stale": stale,
                           "pinned": qp["code"] in pinned, "rpl": rpl})
        scored.sort(key=lambda s: -s["score"])
        # C2 diversity: top-3 must span >=2 sectors
        picks = [scored[0]]
        sectors = {scored[0]["qp"]["sector"]}
        for s in scored[1:]:
            if len(picks) == 3:
                break
            if s["qp"]["sector"] not in sectors or len(sectors) >= 2:
                picks.append(s)
                sectors.add(s["qp"]["sector"])
        # C2 aspiration-override: interest-matched QP outside top-3 shown as a 4th card
        override = None
        if interest:
            for s in scored:
                if s["asp"] == 1.0 and s not in picks:
                    override = s
                    break
        out = {"recommendations": [_rec_card(s) for s in picks],
               "anomaly_flag": bool(state.get("anomaly_flag"))}
        if override:
            out["aspiration_override"] = _rec_card(override)
        now = datetime.now(timezone.utc).isoformat()
        for s in picks:  # B3.2: log picks for the aggregate dashboard
            conn.execute("INSERT INTO recommendations (session_id, qp_code, qp_title, created_at) VALUES (?,?,?,?)",
                         (session_id, s["qp"]["code"], s["qp"]["title"], now))
        return out


# --- B3.2 admin aggregates. C3: aggregates only — no individual rows, no phone hashes, ever. ---

SLOT_KEYS = ("district_name", "education_grade", "primary_interest",
             "mobility_constraint", "preference", "family_occupation", "nearest_market")
RAG_TARGET = 20  # ponytail: demo target/district; real targets from the GIA perspective plan


def _aggregate(conn):
    rows = conn.execute("SELECT state_json, created_at FROM sessions").fetchall()
    states = [json.loads(r["state_json"] or "{}") for r in rows]
    week_ago = date.today() - timedelta(days=7)
    dist = lambda key: dict(Counter(str(s.get(key)) for s in states if s.get(key) is not None))
    rag = []
    for d in conn.execute("SELECT name FROM districts").fetchall():
        n = sum(1 for s in states if s.get("district_name") == d["name"])
        status = "green" if n >= 0.6 * RAG_TARGET else "amber" if n >= 0.3 * RAG_TARGET else "red"
        rag.append({"district": d["name"], "profiled": n, "target": RAG_TARGET, "status": status})
    top = [{"qp_title": t, "count": c} for t, c in conn.execute(
        "SELECT qp_title, COUNT(*) c FROM recommendations GROUP BY qp_title ORDER BY c DESC LIMIT 5")]
    centres = {"active": 0, "unresponsive": 0, "stale": 0}
    for r in conn.execute("SELECT status, last_verified FROM centres").fetchall():
        if r["status"] == "unresponsive":
            centres["unresponsive"] += 1
        else:
            centres["active"] += 1
            if (date.today() - date.fromisoformat(r["last_verified"])).days > 30:
                centres["stale"] += 1  # C6: greyed out in recommendations
    return {"total_sessions": len(rows),
            "consented": sum(1 for s in states if s.get("consent_given")),
            "completed": sum(1 for s in states if all(k in s for k in SLOT_KEYS)),
            "this_week": sum(1 for r in rows if datetime.fromisoformat(r["created_at"]).date() >= week_ago),
            "anomalies": sum(1 for s in states if s.get("anomaly_flag")),
            "contacted": sum(1 for s in states if s.get("centre_contacted")),  # M3 behavioural metric
            "by_language": dist("language"), "by_education": dist("education_grade"),
            "by_interest": dist("primary_interest"), "by_district": dist("district_name"),
            "top_recommended": top, "rag": rag, "centres": centres,
            "outcomes": dict(conn.execute("SELECT result, COUNT(*) c FROM outcomes GROUP BY result").fetchall()),
            "operators": (lambda o: {"total": o["total"] or 0, "certified": o["certified"] or 0})(
                conn.execute("SELECT COUNT(*) AS total, SUM(certified) AS certified FROM operators").fetchone()),
            "pins": [dict(r) for r in conn.execute("SELECT district_lgd, qp_code FROM pinned_courses")]}


@app.get("/admin/stats")
def admin_stats():
    """B3.2 dashboard feed. ponytail: no auth for demo; RBAC per B3.1 before pilot."""
    with db() as conn:
        return _aggregate(conn)


@app.get("/admin/export.csv")
def admin_export():
    """Ministry export (CSV). PDF skipped: CSV opens in any spreadsheet tool."""
    with db() as conn:
        a = _aggregate(conn)
        lines = ["district,profiled,target,status",
                 *[f'{r["district"]},{r["profiled"]},{r["target"]},{r["status"]}' for r in a["rag"]],
                 "", "course,recommendations",
                 *[f'{t["qp_title"]},{t["count"]}' for t in a["top_recommended"]]]
        return Response(content="\n".join(lines), media_type="text/csv")


@app.get("/admin/centres")
def admin_centres():
    """C6: centre list for the dashboard's ground-truth flagging UI. Centres are public
    infrastructure data, not beneficiary PII — C3's aggregate rule doesn't apply here."""
    with db() as conn:
        rows = conn.execute("SELECT id, name, phone, status, last_verified FROM centres ORDER BY name").fetchall()
        return {"centres": [dict(r) for r in rows]}


class CentreStatusIn(BaseModel):
    status: str


@app.post("/admin/centre/{centre_id}/status")
def centre_status(centre_id: int, body: CentreStatusIn):
    """C6 ground-truth: operator marks a centre unresponsive after a failed beneficiary visit.
    ponytail: no auth/operator ID for demo; certification gate per I1.2 before pilot."""
    if body.status not in ("active", "unresponsive", "closed"):
        raise HTTPException(400, "invalid status")
    with db() as conn:
        cur = conn.execute("UPDATE centres SET status=?, last_verified=? WHERE id=?",
                           (body.status, date.today().isoformat(), centre_id))
        if cur.rowcount == 0:
            raise HTTPException(404, "centre not found")
        return {"centre_id": centre_id, "status": body.status}


class FollowupIn(BaseModel):
    result: str  # enrolled | not_enrolled | deciding


@app.post("/session/{session_id}/followup")
def followup(session_id: str, body: FollowupIn):
    """H8: 30-day follow-up outcome (IVR question simulated in PWA). Feeds admin enrolment KPI."""
    if body.result not in ("enrolled", "not_enrolled", "deciding"):
        raise HTTPException(400, "invalid result")
    with db() as conn:
        if not conn.execute("SELECT 1 FROM sessions WHERE id=?", (session_id,)).fetchone():
            raise HTTPException(404, "session not found")
        conn.execute("INSERT INTO outcomes (session_id, result, created_at) VALUES (?,?,?)",
                     (session_id, body.result, datetime.now(timezone.utc).isoformat()))
        return {"ok": True, "result": body.result}


@app.post("/session/{session_id}/contacted")
def contacted(session_id: str):
    """M3: behavioural metric — beneficiary confirms they contacted the training centre."""
    with db() as conn:
        row = conn.execute("SELECT state_json FROM sessions WHERE id=?", (session_id,)).fetchone()
        if not row:
            raise HTTPException(404, "session not found")
        state = json.loads(row["state_json"] or "{}")
        state["centre_contacted"] = True
        conn.execute("UPDATE sessions SET state_json=?, updated_at=? WHERE id=?",
                     (json.dumps(state, ensure_ascii=False), datetime.now(timezone.utc).isoformat(), session_id))
        return {"ok": True}


class OperatorIn(BaseModel):
    name: str


@app.get("/admin/operators")
def admin_operators():
    """H6: operator list with certification status."""
    with db() as conn:
        rows = conn.execute("SELECT id, name, certified FROM operators ORDER BY id").fetchall()
        return {"operators": [dict(r) for r in rows]}


@app.post("/admin/operator")
def add_operator(body: OperatorIn):
    with db() as conn:
        cur = conn.execute("INSERT INTO operators (name, certified) VALUES (?,0)", (body.name,))
        return {"operator_id": cur.lastrowid, "name": body.name, "certified": False}


@app.post("/admin/operator/{op_id}/certify")
def certify_operator(op_id: int):
    """H6: certification gate — quiz pass (>=80%) marks the operator certified."""
    with db() as conn:
        cur = conn.execute("UPDATE operators SET certified=1 WHERE id=?", (op_id,))
        if cur.rowcount == 0:
            raise HTTPException(404, "operator not found")
        return {"operator_id": op_id, "certified": True}


class PinIn(BaseModel):
    district_lgd: str
    qp_code: str


@app.post("/admin/pin")
def pin(body: PinIn):
    """H3: nodal officer pins locally relevant courses; shown with district-office label."""
    with db() as conn:
        if not conn.execute("SELECT 1 FROM qps WHERE code=?", (body.qp_code,)).fetchone():
            raise HTTPException(404, "qp not found")
        conn.execute("INSERT OR IGNORE INTO pinned_courses (district_lgd, qp_code) VALUES (?,?)",
                     (body.district_lgd, body.qp_code))
        return {"ok": True}


@app.delete("/admin/pin")
def unpin(district_lgd: str, qp_code: str):
    with db() as conn:
        conn.execute("DELETE FROM pinned_courses WHERE district_lgd=? AND qp_code=?", (district_lgd, qp_code))
        return {"ok": True}
