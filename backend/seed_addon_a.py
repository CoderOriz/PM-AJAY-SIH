"""Addon A (A4.2/A5/A12): community registry + language-map tables + illustrative seed.
Idempotent: CREATE TABLE IF NOT EXISTS + INSERT OR IGNORE. Run directly or via
ensure_addon_a() at backend startup. All A5 rows are ILLUSTRATIVE (A4.1) and must
be replaced with the official notified list + Census C-16 shares before any wave
goes live (gates G1, A7.2). State codes follow Census/LGD numbering; re-verify
per A8 step 1 (Ladakh 37 and small UTs especially).
"""
import os
import sqlite3

DB = os.path.join(os.path.dirname(__file__), "pmajay.db")

SCHEMA = [
    """CREATE TABLE IF NOT EXISTS sc_community_registry (
      community_id TEXT PRIMARY KEY, state_code TEXT NOT NULL,
      notified_name_en TEXT NOT NULL, notified_name_local TEXT, script TEXT,
      aliases TEXT, parent_group TEXT, order_reference TEXT,
      active INTEGER DEFAULT 1, last_reviewed_at TEXT)""",
    """CREATE TABLE IF NOT EXISTS state_language_map (
      state_code TEXT, language_code TEXT, role TEXT, tier TEXT,
      voice_mode TEXT, standby_asr INTEGER, sms_script TEXT, tts_available INTEGER,
      last_verified_at TEXT, PRIMARY KEY (state_code, language_code))""",
    """CREATE TABLE IF NOT EXISTS district_language_mix (
      lgd_district_code TEXT, language_code TEXT, census_share REAL, source_year INT,
      PRIMARY KEY (lgd_district_code, language_code))""",
    # A4.3: personal data, stored apart; indexed by PK only (A12 step 3)
    """CREATE TABLE IF NOT EXISTS beneficiary_community (
      phone_hash TEXT PRIMARY KEY, community_id TEXT, declared_at TEXT,
      consent_ref TEXT, purpose TEXT)""",
    "CREATE INDEX IF NOT EXISTS idx_slm_voice ON state_language_map(state_code, voice_mode)",
    "CREATE INDEX IF NOT EXISTS idx_dlm_share ON district_language_mix(lgd_district_code, census_share DESC)",
    "CREATE INDEX IF NOT EXISTS idx_scr_state ON sc_community_registry(state_code, active)",
]

# (state_code, language, role, tier). voice_mode derives from tier (A→voice_first,
# B→dtmf_first, C→human_assisted) except Tier A pending G3 review → dtmf_first.
PENDING_G3 = {"mai", "sat", "kok", "doi", "kas", "ne", "sd", "brx", "mni"}
STATE_LANGS = {
    "09": [("hi", "primary", "A"), ("ur", "secondary", "A"), ("awa", "regional_variety", "B"),
           ("bho", "regional_variety", "B"), ("brj", "regional_variety", "B"), ("bns", "regional_variety", "B")],
    "10": [("hi", "primary", "A"), ("mai", "primary", "A"), ("ur", "secondary", "A"),
           ("bho", "regional_variety", "B"), ("mag", "regional_variety", "B")],
    "20": [("hi", "primary", "A"), ("sat", "primary", "A"), ("bn", "secondary", "A"), ("mai", "secondary", "A")],
    "08": [("hi", "primary", "A"), ("mwr", "regional_variety", "B")],
    "23": [("hi", "primary", "A"), ("bns", "regional_variety", "B")],
    "22": [("hi", "primary", "A"), ("hne", "regional_variety", "B")],
    "06": [("hi", "primary", "A"), ("pa", "secondary", "A")],
    "03": [("pa", "primary", "A"), ("hi", "secondary", "A")],
    "02": [("hi", "primary", "A"), ("pa", "secondary", "A")],
    "05": [("hi", "primary", "A")],
    "01": [("doi", "primary", "A"), ("kas", "primary", "A"), ("ur", "primary", "A"), ("hi", "secondary", "A")],
    "07": [("hi", "primary", "A"), ("pa", "secondary", "A"), ("ur", "secondary", "A")],
    "04": [("hi", "primary", "A"), ("pa", "secondary", "A")],
    "27": [("mr", "primary", "A"), ("hi", "secondary", "A")],
    "24": [("gu", "primary", "A"), ("hi", "secondary", "A"), ("sd", "secondary", "A")],
    "30": [("kok", "primary", "A"), ("mr", "secondary", "A"), ("hi", "secondary", "A")],
    "28": [("te", "primary", "A"), ("ur", "secondary", "A")],
    "36": [("te", "primary", "A"), ("ur", "secondary", "A"), ("hi", "secondary", "A")],
    "29": [("kn", "primary", "A"), ("ur", "secondary", "A"), ("tcy", "regional_variety", "B"), ("kok", "secondary", "A")],
    "33": [("ta", "primary", "A")],
    "32": [("ml", "primary", "A")],
    "34": [("ta", "primary", "A"), ("ml", "secondary", "A"), ("te", "secondary", "A")],
    "19": [("bn", "primary", "A"), ("hi", "secondary", "A"), ("ur", "secondary", "A"), ("ne", "secondary", "A")],
    "21": [("or", "primary", "A"), ("hi", "secondary", "A"), ("bn", "secondary", "A")],
    "18": [("as", "primary", "A"), ("bn", "secondary", "A"), ("brx", "secondary", "A"), ("hi", "secondary", "A")],
    "16": [("bn", "primary", "A"), ("kokborok", "regional_variety", "C")],
    "14": [("mni", "primary", "A"), ("bn", "secondary", "A")],
    "11": [("ne", "primary", "A"), ("hi", "secondary", "A")],
    "37": [("hi", "primary", "A")],  # Ladakh: minimal-config, verify list first
}

SCRIPTS = {"mr": "Devanagari", "hi": "Devanagari", "bn": "Bengali", "ta": "Tamil",
           "te": "Telugu", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
           "or": "Odia", "pa": "Gurmukhi", "as": "Assamese", "ur": "Perso-Arabic",
           "mai": "Devanagari", "sat": "Ol Chiki", "kok": "Devanagari", "doi": "Devanagari",
           "kas": "Perso-Arabic", "ne": "Devanagari", "sd": "Devanagari", "brx": "Devanagari",
           "mni": "Bengali", "awa": "Devanagari", "bho": "Devanagari", "brj": "Devanagari",
           "bns": "Devanagari", "mag": "Devanagari", "hne": "Devanagari", "mwr": "Devanagari",
           "tcy": "Kannada", "kokborok": "Bengali"}
# Google standby (M4/A3.5) covers scheduled majors only; Tier B/C have no standby.
STANDBY = {"hi", "mr", "bn", "ta", "te", "gu", "kn", "ml", "or", "pa", "ur", "as"}

# Script per state for notified_name_local (A4.2 script column)
STATE_SCRIPT = {"09": "Devanagari", "10": "Devanagari", "20": "Devanagari",
                "08": "Devanagari", "23": "Devanagari", "22": "Devanagari",
                "06": "Devanagari", "03": "Gurmukhi", "02": "Devanagari",
                "01": "Devanagari", "07": "Devanagari", "27": "Devanagari",
                "24": "Gujarati", "28": "Telugu", "36": "Telugu",
                "29": "Kannada", "33": "Tamil", "32": "Malayalam",
                "19": "Bengali", "21": "Odia", "18": "Bengali", "16": "Bengali"}
COMMUNITIES = [
    ("09", "Chamar/Jatav", "चमार/जाटव", "Chamar"), ("09", "Pasi", "पासी", "Pasi"),
    ("10", "Dusadh", "दुसाध", "Dusadh"), ("10", "Musahar", "मुसहर", "Musahar"),
    ("20", "Dom", "डोम", "Dom"),
    ("08", "Meghwal", "मेघवाल", "Meghwal"),
    ("23", "Balai", "बलाई", "Balai"),
    ("22", "Satnami", "सतनामी", "Satnami"),
    ("06", "Balmiki", "बाल्मीकि", "Balmiki"),
    ("03", "Mazhabi Sikh", "ਮਜ਼੍ਹਬੀ ਸਿੱਖ", "Mazhabi"), ("03", "Ravidasia", "ਰਵਿਦਾਸੀਆ", "Ravidasia"),
    ("02", "Koli", "कोली", "Koli"),
    ("01", "Megh", "मेघ", "Megh"),
    ("07", "Valmiki", "वाल्मीकि", "Valmiki"),
    ("27", "Mahar", "महार", "Mahar"), ("27", "Matang", "मातंग", "Matang"),
    ("24", "Vankar", "વણકર", "Vankar"),
    ("28", "Mala", "మాల", "Mala"), ("28", "Madiga", "మాదిగ", "Madiga"),
    ("36", "Madiga", "మాదిగ", "Madiga"),
    ("29", "Holeya", "ಹೊಳೆಯ", "Holeya"), ("29", "Madiga", "ಮಾದಿಗ", "Madiga"),
    ("33", "Paraiyar", "பறையர்", "Paraiyar"), ("33", "Pallar", "பள்ளர்", "Pallar"),
    ("32", "Pulayan", "പുലയൻ", "Pulayan"),
    ("19", "Rajbanshi", "রাজবংশী", "Rajbanshi"), ("19", "Namasudra", "নমঃশূদ্র", "Namasudra"),
    ("21", "Pana", "ପଣା", "Pana"), ("21", "Dom", "ଡୋମ", "Dom"),
    ("18", "Namasudra", "নমঃশূদ্ৰ", "Namasudra"),
    ("16", "Dhoba", "ধোবা", "Dhoba"),
]

# (lgd_district, language, share, year) — illustrative C-16-style shares (A4.2)
DISTRICT_MIX = [
    ("523", "mr", 0.62, 2011), ("523", "hi", 0.28, 2011),
    ("520", "mr", 0.55, 2011), ("520", "hi", 0.30, 2011),
    ("528", "mr", 0.70, 2011), ("528", "hi", 0.18, 2011),
    ("527", "mr", 0.75, 2011), ("527", "hi", 0.12, 2011),
]


def ensure_addon_a():
    conn = sqlite3.connect(DB)
    try:
        for stmt in SCHEMA:
            conn.execute(stmt)
        for state, langs in STATE_LANGS.items():
            for lang, role, tier in langs:
                voice = ("voice_first" if tier == "A" and lang not in PENDING_G3
                         else "dtmf_first" if tier in ("A", "B") else "human_assisted")
                conn.execute(
                    "INSERT OR IGNORE INTO state_language_map VALUES (?,?,?,?,?,?,?,?,?)",
                    (state, lang, role, tier, voice, int(lang in STANDBY),
                     SCRIPTS.get(lang, ""), int(tier == "A"), None))
        for lgd, lang, share, year in DISTRICT_MIX:
            conn.execute("INSERT OR IGNORE INTO district_language_mix VALUES (?,?,?,?)",
                         (lgd, lang, share, year))
        for state, en, local, parent in COMMUNITIES:
            cid = "%s:%s" % (state, en.lower().replace("/", "-").replace(" ", "-"))
            conn.execute(
                "INSERT OR IGNORE INTO sc_community_registry VALUES (?,?,?,?,?,?,?,?,?,?)",
                (cid, state, en, local, STATE_SCRIPT.get(state, "Devanagari"), None, parent,
                 "ILLUSTRATIVE (A4.1) - replace with notified list", 1, None))
        conn.commit()
    finally:
        conn.close()


if __name__ == "__main__":
    ensure_addon_a()
    print("addon A tables + illustrative seed ready")
