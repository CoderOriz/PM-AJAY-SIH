"""Creates pmajay.db and seeds NSQF QPs, Pune training centres, and LGD district codes."""
import json
import os
import random
import sqlite3
from datetime import date, timedelta

DB = os.path.join(os.path.dirname(__file__), "pmajay.db")

# (SSC code prefix, sector name, [(QP title, NSQF level, min education), ...])
SECTORS = [
    ("AMH", "Apparel, Made-ups & Home Furnishing", [
        ("Self-Employed Tailor", 3, "Class 8"),
        ("Dress Maker", 3, "Class 8"),
        ("Sewing Machine Operator", 2, "Class 5"),
        ("Hand Embroiderer", 2, "Class 5"),
        ("Fashion Designer", 4, "Class 10"),
        ("Pattern Maker", 4, "Class 10"),
        ("Home Furnishing Maker", 3, "Class 8"),
        ("Garment Checker", 3, "Class 8"),
        ("Custom Tailoring Entrepreneur", 4, "Class 8"),
        ("Textile Quality Inspector", 4, "Class 10"),
        ("Made-up Fabric Worker", 2, "Class 5"),
        ("Alteration Tailor", 2, "Class 5"),
    ]),
    ("AGR", "Agriculture & Allied", [
        ("Nursery Worker", 2, "Class 5"),
        ("Dairy Farmer Entrepreneur", 4, "Class 8"),
        ("Poultry Worker", 2, "Class 5"),
        ("Greenhouse Operator", 3, "Class 8"),
        ("Organic Grower", 3, "Class 8"),
        ("Bee-Keeping Entrepreneur", 3, "Class 5"),
        ("Farm Machine Operator", 3, "Class 8"),
        ("Irrigation Technician", 3, "Class 8"),
        ("Seed Grader", 2, "Class 5"),
        ("Fisheries Worker", 2, "Class 5"),
        ("Goat Rearing Entrepreneur", 3, "Class 5"),
        ("Agri Input Seller", 3, "Class 8"),
    ]),
    ("CON", "Construction", [
        ("Mason", 3, "Class 5"),
        ("Bar Bender", 2, "Class 5"),
        ("Shuttering Carpenter", 2, "Class 5"),
        ("General Plumber", 3, "Class 5"),
        ("Domestic Electrician", 3, "Class 8"),
        ("Tile Layer", 2, "Class 5"),
        ("Decorative Painter", 2, "Class 5"),
        ("Scaffold Assembler", 2, "Class 5"),
        ("Construction Supervisor", 4, "Class 10"),
        ("POP Worker", 2, "Class 5"),
        ("Waterproofing Applicator", 2, "Class 5"),
        ("Formwork Carpenter", 3, "Class 5"),
    ]),
    ("BTY", "Beauty & Wellness", [
        ("Beauty Therapist", 3, "Class 8"),
        ("Hair Stylist", 3, "Class 8"),
        ("Makeup Artist", 3, "Class 8"),
        ("Mehendi Artist", 2, "Class 5"),
        ("Spa Therapist", 3, "Class 8"),
        ("Nail Technician", 2, "Class 8"),
        ("Salon Manager", 4, "Class 10"),
        ("Salon Entrepreneur", 4, "Class 8"),
        ("Beauty Advisor", 2, "Class 8"),
        ("Facial Therapy Assistant", 2, "Class 5"),
    ]),
    ("HLT", "Healthcare", [
        ("Home Health Aide", 3, "Class 8"),
        ("General Duty Assistant", 3, "Class 8"),
        ("Geriatric Care Aide", 3, "Class 8"),
        ("Community Health Worker", 4, "Class 10"),
        ("Dental Assistant", 3, "Class 10"),
        ("Patient Care Assistant", 2, "Class 5"),
        ("Phlebotomy Assistant", 4, "Class 10"),
        ("Nutrition Awareness Assistant", 3, "Class 8"),
    ]),
    ("RET", "Retail", [
        ("Store Operations Assistant", 3, "Class 8"),
        ("Retail Sales Associate", 2, "Class 5"),
        ("Cashier", 2, "Class 8"),
        ("Visual Merchandiser", 3, "Class 8"),
        ("Inventory Clerk", 2, "Class 5"),
        ("Delivery Associate", 2, "Class 5"),
        ("Kirana Store Entrepreneur", 3, "Class 5"),
        ("Customer Service Executive", 3, "Class 10"),
        ("Warehouse Picker", 2, "Class 5"),
        ("Retail Supervisor", 4, "Class 10"),
    ]),
    ("IIT", "IT-ITeS", [
        ("Data Entry Operator", 2, "Class 8"),
        ("Computer Hardware Assistant", 3, "Class 8"),
        ("Field Technician: Networking", 3, "Class 8"),
        ("Junior Software Developer", 5, "Class 12"),
        ("Web Design Assistant", 3, "Class 10"),
        ("CRM Executive", 3, "Class 10"),
        ("BPO Voice Executive", 2, "Class 10"),
        ("Domestic Data Entry Associate", 2, "Class 8"),
        ("Digital Marketing Assistant", 3, "Class 10"),
        ("IT Support Entrepreneur", 4, "Class 10"),
    ]),
    ("AUT", "Automotive", [
        ("Automotive Service Technician", 3, "Class 8"),
        ("Two-Wheeler Mechanic", 2, "Class 5"),
        ("Four-Wheeler Mechanic", 3, "Class 8"),
        ("Auto Electrician", 3, "Class 8"),
        ("Battery Repair Technician", 2, "Class 5"),
        ("Denting Painting Technician", 2, "Class 5"),
        ("Garage Entrepreneur", 4, "Class 8"),
        ("EV Charging Station Technician", 3, "Class 10"),
        ("Vehicle Inspection Assistant", 2, "Class 8"),
        ("Driving Instructor", 3, "Class 10"),
    ]),
    ("LTH", "Leather & Footwear", [
        ("Leather Goods Maker", 2, "Class 5"),
        ("Footwear Maker", 2, "Class 5"),
        ("Leather Stitching Operator", 2, "Class 5"),
        ("Shoe Repair Technician", 2, "Class 5"),
        ("Bag Designer", 3, "Class 8"),
        ("Leather Craft Entrepreneur", 4, "Class 8"),
        ("Footwear Quality Checker", 3, "Class 8"),
        ("Saddle & Harness Maker", 2, "Class 5"),
    ]),
    ("FDP", "Food Processing", [
        ("Bakery Worker", 2, "Class 5"),
        ("Sweet Maker Entrepreneur", 3, "Class 5"),
        ("Pickle & Papad Maker", 2, "Class 5"),
        ("Food Packaging Operator", 2, "Class 5"),
        ("Quality Control Assistant", 3, "Class 8"),
        ("Dairy Products Processor", 3, "Class 8"),
        ("Spice Grinding Entrepreneur", 3, "Class 5"),
        ("Catering Assistant", 2, "Class 5"),
        ("Cold Storage Operator", 3, "Class 8"),
        ("Food & Beverage Service Steward", 3, "Class 8"),
    ]),
    ("ELX", "Electronics & Hardware", [
        ("Mobile Phone Repair Technician", 2, "Class 8"),
        ("Solar Panel Installer", 3, "Class 8"),
        ("TV Service Technician", 2, "Class 8"),
        ("Home Appliance Repair Technician", 2, "Class 8"),
        ("Electronics Assembly Operator", 2, "Class 5"),
        ("Laptop Repair Technician", 3, "Class 10"),
        ("CCTV Installation Technician", 3, "Class 8"),
        ("Inverter & Battery Service Technician", 2, "Class 8"),
    ]),
    ("TXL", "Textiles & Handloom", [
        ("Handloom Weaver", 2, "Class 5"),
        ("Power Loom Operator", 2, "Class 5"),
        ("Traditional Weaver Entrepreneur", 4, "Class 5"),
        ("Block Printer", 2, "Class 5"),
        ("Tie & Dye Artisan", 2, "Class 5"),
        ("Saree Finishing Worker", 2, "Class 5"),
        ("Loom Mechanic", 3, "Class 8"),
        ("Handicraft Entrepreneur", 4, "Class 5"),
    ]),
]

SCHEME_FLAGS = ["PMKVY"] * 6 + ["PMKVY,PM-AJAY GIA"] * 3 + ["Mudra", "NSFDC"]
PHYSICAL = ["None"] * 7 + ["Standing for long hours", "Heavy lifting", "Fine hand work"]

# LGD district codes. ponytail: only Pune (523) verified against lgdirectory.gov.in;
# verify the rest before any real deployment. Demo queries Pune only.
DISTRICTS = {
    "Pune": "523",
    "Mumbai Suburban": "520",
    "Nashik": "527",
    "Nagpur": "528",
    "Solapur": "534",
    "Kolhapur": "530",
    "Chhatrapati Sambhajinagar": "516",
    "Amravati": "514",
    "Satara": "531",
    "Ahmednagar": "515",
}

# 20 Pune training centres: (name, lat, lng). One stale (>30 days, grey-out demo),
# one 'unresponsive'.
AREAS = [
    ("Hadapsar Skill Development Centre", 18.5018, 73.9268),
    ("Kothrud Kaushalya Kendra", 18.5070, 73.8070),
    ("Swargate Training Centre", 18.5010, 73.8600),
    ("Pimpri Skill Centre", 18.6200, 73.8000),
    ("Chinchwad Kaushalya Kendra", 18.6290, 73.8100),
    ("Yerawada Skill Centre", 18.5520, 73.8800),
    ("Aundh Training Centre", 18.5630, 73.8070),
    ("Kharadi Skill Development Centre", 18.5450, 73.9400),
    ("Wagholi Kaushalya Kendra", 18.5770, 73.9600),
    ("Hinjewadi Training Centre", 18.5910, 73.7390),
    ("Katraj Skill Centre", 18.4510, 73.8620),
    ("Dhankawadi Training Centre", 18.4700, 73.8500),
    ("Bibwewadi Skill Centre", 18.4660, 73.8560),
    ("Nigdi Kaushalya Kendra", 18.6400, 73.7850),
    ("Akurdi Training Centre", 18.6330, 73.7880),
    ("Dapodi Skill Centre", 18.6020, 73.7950),
    ("Vishrantwadi Training Centre", 18.5570, 73.8720),
    ("Chandan Nagar Skill Centre", 18.5530, 73.9010),
    ("Market Yard Training Centre", 18.4830, 73.8600),
    ("Sinhagad Road Kaushalya Kendra", 18.4700, 73.8200),
]

SCHEMA = """
CREATE TABLE qps (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE,
  title TEXT,
  sector TEXT,
  nsqf_level INTEGER,
  duration_months INTEGER,
  min_education TEXT,
  physical_req TEXT,
  scheme_flags TEXT
);
CREATE TABLE centres (
  id INTEGER PRIMARY KEY,
  name TEXT,
  district_lgd TEXT,
  district_name TEXT,
  lat REAL,
  lng REAL,
  phone TEXT,
  last_verified TEXT,
  status TEXT,
  qp_codes TEXT
);
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  phone_hash TEXT,
  created_at TEXT,
  updated_at TEXT,
  state_json TEXT
);
CREATE TABLE recommendations (
  id INTEGER PRIMARY KEY,
  session_id TEXT,
  qp_code TEXT,
  qp_title TEXT,
  created_at TEXT
);
CREATE TABLE outcomes (
  session_id TEXT,
  result TEXT,
  created_at TEXT
);
CREATE TABLE operators (
  id INTEGER PRIMARY KEY,
  name TEXT,
  certified INTEGER DEFAULT 0
);
CREATE TABLE pinned_courses (
  district_lgd TEXT,
  qp_code TEXT
);
"""


def main():
    random.seed(42)
    if os.path.exists(DB):
        os.remove(DB)
    conn = sqlite3.connect(DB)
    conn.executescript(SCHEMA)

    qpcodes = []
    n = 0
    for abbr, sector, roles in SECTORS:
        for title, level, edu in roles:
            code = f"{abbr}/Q{n + 1:04d}"
            n += 1
            qpcodes.append(code)
            conn.execute(
                "INSERT INTO qps VALUES (?,?,?,?,?,?,?,?,?)",
                (None, code, title, sector, level,
                 random.choice([3, 6, 9, 12]), edu,
                 random.choice(PHYSICAL), random.choice(SCHEME_FLAGS)),
            )

    # Each centre offers ~6 QPs; codes shuffled deterministically and dealt round-robin.
    random.shuffle(qpcodes)
    chunks = [qpcodes[i::len(AREAS)] for i in range(len(AREAS))]
    for i, (name, lat, lng) in enumerate(AREAS):
        verified = date.today() - timedelta(days=45 if i == 8 else 3)
        status = "unresponsive" if i == 12 else "active"
        conn.execute(
            "INSERT INTO centres VALUES (?,?,?,?,?,?,?,?,?,?)",
            (None, name, "523", "Pune", lat, lng,
             f"020-27{random.randint(100000, 999999)}",
             verified.isoformat(), status, json.dumps(chunks[i])),
        )

    # LGD district reference table
    conn.execute("CREATE TABLE districts (lgd TEXT PRIMARY KEY, name TEXT)")
    for name, lgd in DISTRICTS.items():
        conn.execute("INSERT INTO districts VALUES (?,?)", (lgd, name))

    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
    conn = sqlite3.connect(DB)
    n_qp = conn.execute("SELECT COUNT(*) FROM qps").fetchone()[0]
    n_ct = conn.execute("SELECT COUNT(*) FROM centres").fetchone()[0]
    n_d = conn.execute("SELECT COUNT(*) FROM districts").fetchone()[0]
    pune = conn.execute("SELECT COUNT(*) FROM centres WHERE district_lgd='523'").fetchone()[0]
    conn.close()
    assert n_qp >= 100, "QP seed failed"
    assert n_ct == 20 and pune == 20, "centre seed failed"
    assert n_d == len(DISTRICTS), "district seed failed"
    print(f"seeded: {n_qp} QPs, {n_ct} centres ({pune} Pune), {n_d} districts -> {DB}")
