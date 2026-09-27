"""Day 3 scorer check: 10 personas through the full pipeline. Run with server up on :8000."""
import json
import urllib.request

BASE = "http://localhost:8000"


def post(path, body):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return json.load(r)


# (name, slots) — spanning education, interest, mobility, markets
PERSONAS = [
    ("Sunita-tailor", dict(education_grade=8, primary_interest="tailoring", mobility_constraint=False, nearest_market="Hadapsar")),
    ("Ramesh-farm", dict(education_grade=5, primary_interest="farming", mobility_constraint=False, nearest_market="Katraj")),
    ("Meena-beauty", dict(education_grade=10, primary_interest="beauty", mobility_constraint=False, nearest_market="Kothrud")),
    ("Arjun-mobile", dict(education_grade=10, primary_interest="mobile repair", mobility_constraint=False, nearest_market="Kharadi")),
    ("Lata-shop", dict(education_grade=8, primary_interest="shop", mobility_constraint=False, nearest_market="Market Yard")),
    ("Shobha-mobility", dict(education_grade=8, primary_interest="tailoring", mobility_constraint=True, nearest_market="Swargate")),
    ("Ganesh-carpentry", dict(education_grade=5, primary_interest="carpentry", mobility_constraint=False, nearest_market="Pimpri")),
    ("Priya-weaving", dict(education_grade=8, primary_interest="weaving", mobility_constraint=False, nearest_market="Bibwewadi")),
    ("Vikas-lowEdu", dict(education_grade=0, primary_interest="farming", mobility_constraint=False, nearest_market="Wagholi")),
    ("Nita-grad", dict(education_grade=15, primary_interest="beauty", mobility_constraint=False, nearest_market="Hinjewadi")),
]

BASE_SLOTS = dict(district_name="Pune", district_lgd="523", preference="self_employment",
                  family_occupation="farming", language="mr", consent_given=True)

for i, (name, extra) in enumerate(PERSONAS):
    sid = post("/session", {"phone": f"90000002{i:02d}"})["session_id"]
    post(f"/session/{sid}/profile", {"slots": {**BASE_SLOTS, **extra}})
    recs = get(f"/session/{sid}/recommendations")
    top = recs["recommendations"]

    assert len(top) == 3, f"{name}: expected 3 picks"
    assert len({r["sector"] for r in top}) >= 2, f"{name}: diversity constraint failed"
    assert top[0]["distance_km"] is not None or top[0]["centre"] is None, f"{name}: distance missing"
    all_recs = top + ([recs["aspiration_override"]] if recs.get("aspiration_override") else [])
    if extra.get("mobility_constraint"):
        for r in all_recs:
            assert r["physical_req"] == "None", f"{name}: physical QP recommended ({r['title']})"

    line = " | ".join(f"{r['title']} ({r['distance_km']}km)" for r in top)
    print(f"{name:16} -> {line}" + (f"  [+override: {recs['aspiration_override']['title']}]" if recs.get("aspiration_override") else ""))

# spot-check: Sunita's top pick matches her stated interest's sector
s = post("/session", {"phone": "9000000299"})["session_id"]
post(f"/session/{s}/profile", {"slots": {**BASE_SLOTS, **PERSONAS[0][1]}})
assert "Apparel" in get(f"/session/{s}/recommendations")["recommendations"][0]["sector"], "aspiration not ranked first"

print("10 personas OK")
