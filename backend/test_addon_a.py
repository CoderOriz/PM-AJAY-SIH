"""Addon A checks: language registry, greeting sets, v2.1 profile fields,
community consent flow, small-cell suppression. Run with server up on :8000."""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8000"


AUTH = {"Content-Type": "application/json"}  # gains the admin token after login (Q3/RBAC)


def post(path, body):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(),
                                 headers=AUTH)
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def get(path):
    req = urllib.request.Request(BASE + path, headers=AUTH)
    with urllib.request.urlopen(req) as r:
        return json.load(r)


# Q3/RBAC: admin routes are JWT-gated — sign in (ops = full access) and carry the token
_login = urllib.request.Request(BASE + "/admin/login", data=json.dumps(
    {"username": "ops", "password": "sathi-demo"}).encode(), headers=AUTH)
with urllib.request.urlopen(_login) as _r:
    AUTH["Authorization"] = f"Bearer {json.load(_r)['token']}"

# RBAC gating: no token -> 401, operator role -> 403 (ops allowed above)
for _headers, _expected in (
        (dict(), 401),
        ({"Authorization": "Bearer " + post("/admin/login", {"username": "operator1", "password": "sathi-demo"})["token"]}, 403)):
    _req = urllib.request.Request(BASE + "/admin/stats", headers=_headers)
    try:
        urllib.request.urlopen(_req)
        raise AssertionError(f"expected {_expected}, succeeded")
    except urllib.error.HTTPError as _e:
        assert _e.code == _expected, f"expected {_expected}, got {_e.code}"
print("RBAC OK: no-token 401 / operator 403 / ops allowed")


def post_expect(path, body, status):
    try:
        post(path, body)
    except urllib.error.HTTPError as e:
        assert e.code == status, f"{path}: expected {status}, got {e.code}"
        return
    assert False, f"{path}: expected HTTP {status}, succeeded"

# A3.1/A4.2: registry serves tiers + voice modes per state
langs = get("/languages")["languages"]
assert len(langs) > 70, f"expected 70+ registry rows, got {len(langs)}"
states = {r["state_code"] for r in langs}
assert {"09", "10", "27", "33", "19"} <= states, f"key states missing: {states}"
mh = {(r["language_code"], r["tier"], r["voice_mode"]) for r in langs if r["state_code"] == "27"}
assert ("mr", "A", "voice_first") in mh and ("hi", "A", "voice_first") in mh, mh
up = {(r["language_code"], r["voice_mode"]) for r in langs if r["state_code"] == "09"}
assert ("bho", "dtmf_first") in up, "Bhojpuri must be Tier B dtmf_first"
assert ("mai", "dtmf_first") in [ (r["language_code"], r["voice_mode"]) for r in langs
                                  if r["state_code"] == "10"], "Maithili pending G3 stays dtmf_first"
print("registry OK:", len(langs), "rows")

# A3.4: district greeting set ordered + Hindi always present
g = get("/districts/523/languages")
assert g["languages"][0] == "mr" and "hi" in g["languages"], g
assert g["voice_modes"]["mr"] == "voice_first", g
g2 = get("/districts/999/languages")
assert g2["languages"] == ["hi"], f"unknown district falls back to Hindi: {g2}"
print("greeting sets OK:", g)

# A4.4: v2.1 profile fields ingest (migrant-flagged Tamil session)
sid = post("/session", {"phone": "9000000001"})["session_id"]
post(f"/session/{sid}/profile", {"slots": {
    "language": "ta", "language_detected": "ta", "language_confirmed_by_user": True,
    "state_of_residence_lgd": "27", "state_of_origin_lgd": "33", "migrant_flag": True,
    "voice_mode": "voice_first", "district_name": "Pune", "district_lgd": "523",
    "education_grade": 8, "primary_interest": "tailoring", "consent_given": True}})
recs = get(f"/session/{sid}/recommendations")
assert len(recs["recommendations"]) >= 1, "Tamil session gets recommendations (language-agnostic engine)"
print("v2.1 profile + Tamil recs OK:", [r["title"] for r in recs["recommendations"]][:2])

# Unknown slot keys still dropped (C3 trust boundary holds for v2.1)
post(f"/session/{sid}/profile", {"slots": {"community_id": "09:chamar", "evil": 1}})
s2 = post("/session", {"phone": "9000000001"})
assert "community_id" not in s2["confirmed_slots"] and "evil" not in s2["confirmed_slots"], \
    "community_id must NOT enter state_json (A4.3 stored apart)"
print("trust boundary OK: community_id + unknown keys dropped from profile")

# A4.3: skip path records aggregate flag, never blocks
r = post(f"/session/{sid}/community", {"skip": True})
assert r == {"ok": True, "skipped": True}, r
# Answer path requires separate consent_ref...
post_expect(f"/session/{sid}/community",
            {"community_id": "27:mahar", "purpose": "test"}, 400)
# ...validates against the registry...
post_expect(f"/session/{sid}/community",
            {"community_id": "99:nope", "consent_ref": "c1", "purpose": "test"}, 404)
# ...and stores apart on success
r = post(f"/session/{sid}/community",
         {"community_id": "27:mahar", "consent_ref": "c1", "purpose": "test"})
assert r == {"ok": True, "skipped": False}, r
print("community consent flow OK (skip / 400-no-consent / 404-unknown / store)")

# A9.3: small-cell suppression in stats (1 Tamil session < 20 → suppressed)
stats = get("/admin/stats")
assert "by_state" in stats, "stats must carry by_state"
assert stats["by_state"].get("other_suppressed", 0) >= 1, stats["by_state"]
assert "33" not in stats["by_state"] and "27" not in stats["by_state"], \
    "small state cells must not appear individually"
print("suppression OK:", stats["by_state"])

print("ALL ADDON A CHECKS PASSED")
