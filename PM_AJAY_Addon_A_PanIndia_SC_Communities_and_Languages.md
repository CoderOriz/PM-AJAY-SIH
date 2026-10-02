---
document_type: implementation_plan_addon
addon_id: "A"
addon_title: "Pan-India Scheduled Caste Communities & Regional Languages Expansion"
addon_version: "1.0"
base_plan: "PM-AJAY Implementation Plan v2.0 (Hardened)"
base_plan_modified: false
scheme: "Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY) - Grant-in-Aid (GIA) Component"
relationship_to_base: "Extends the Pune/Marathi + Hindi pilot to all states and UTs. Does not alter any v2.0 requirement, timeline, or fix."
activation: "Feature-flagged per state and per language; nothing in this addon is active during the 8-week Pune pilot"
coverage: "All 28 states and 8 UTs; 22 Eighth Schedule languages plus major non-scheduled regional languages and speech varieties"
encoding: UTF-8
format: markdown
heading_anchor_style: github-slug
sections:
  - id: "A1"
    title: "Purpose, Scope & Relationship to the Base Plan"
  - id: "A2"
    title: "Design Principles for Pan-India Coverage"
  - id: "A3"
    title: "Language Coverage Architecture"
  - id: "A4"
    title: "SC Community Registry & Data Model Additions"
  - id: "A5"
    title: "State and UT Coverage Matrix"
  - id: "A6"
    title: "Component-by-Component Changes to the Base Plan"
  - id: "A7"
    title: "Rollout Waves & Exit Gates"
  - id: "A8"
    title: "Per-State Onboarding Protocol"
  - id: "A9"
    title: "QA, Bias Audit & KPI Extensions"
  - id: "A10"
    title: "Team, Partners & Operations"
  - id: "A11"
    title: "Addon Risk Register & Watch List"
  - id: "A12"
    title: "Database Checklist Deltas"
  - id: "A13"
    title: "References"
---

# ADDON A - Pan-India SC Communities & Regional Languages Expansion
## Companion to: PM-AJAY AI-Powered Multilingual Voice Livelihood Assistant, Implementation Plan v2.0 (Hardened)

**Status:** Addon v1.0 - additive only; base plan v2.0 is unchanged. 
**Base pilot (unchanged):** Pune District, Maharashtra - Marathi + Hindi - 50-100 beneficiaries. 
**This addon covers:** Scheduled Caste (SC) communities and the regional languages of every state and UT in India. 
**Reading order:** Read the base plan first. Each section here names the base-plan section it extends (e.g. "extends F1.1").

---

## Table of Contents

- [A1. Purpose, Scope & Relationship to the Base Plan](#a1-purpose-scope--relationship-to-the-base-plan)
- [A2. Design Principles for Pan-India Coverage](#a2-design-principles-for-pan-india-coverage)
- [A3. Language Coverage Architecture](#a3-language-coverage-architecture)
- [A4. SC Community Registry & Data Model Additions](#a4-sc-community-registry--data-model-additions)
- [A5. State and UT Coverage Matrix](#a5-state-and-ut-coverage-matrix)
- [A6. Component-by-Component Changes to the Base Plan](#a6-component-by-component-changes-to-the-base-plan)
- [A7. Rollout Waves & Exit Gates](#a7-rollout-waves--exit-gates)
- [A8. Per-State Onboarding Protocol](#a8-per-state-onboarding-protocol)
- [A9. QA, Bias Audit & KPI Extensions](#a9-qa-bias-audit--kpi-extensions)
- [A10. Team, Partners & Operations](#a10-team-partners--operations)
- [A11. Addon Risk Register & Watch List](#a11-addon-risk-register--watch-list)
- [A12. Database Checklist Deltas](#a12-database-checklist-deltas)
- [A13. References](#a13-references)

---

## A1. Purpose, Scope & Relationship to the Base Plan

### A1.1 Purpose

The base plan proves the concept in one district with two languages. This addon defines how the same system extends to **every Scheduled Caste community in every state and UT**, in the regional languages those communities actually speak, without re-architecting what the pilot builds.

### A1.2 What is in scope

- All notified SC communities in all states and UTs, as listed in the Constitution (Scheduled Castes) Order and its amendments, handled through a **data-driven community registry** (A4), not hard-coded lists.
- All 22 Eighth Schedule languages (voice-relevant ones) plus the major non-scheduled regional languages and speech varieties that SC communities use (A3, A5).
- Per-state data, dialogue, QA, partner, and compliance work needed to enable each language and state safely (A7, A8).

### A1.3 What is explicitly out of scope

- Changing the pilot. Pune, Marathi + Hindi, 8 weeks, six-person team - all as specified in the base plan.
- Eligibility determination. As in H9, the voice interview stays advisory; Aadhaar/DigiLocker verification remains the gate for any benefit.
- Caste certificate verification. Whether a person is a notified SC in a given state is decided by the state's certificate process, never by this system.

### A1.4 How this addon relates to the base plan

| Base-plan item | Relationship |
|---|---|
| M7 (scale is not a language swap) | This addon **operationalises** M7 for all states; the per-state protocol in A8 is the ethnographic research phase M7 requires |
| Base Phases 2-4 (Nagpur, Maharashtra-wide, Tamil Nadu + Telangana) | Subsumed and extended by the wave plan in A7; the base roadmap's ordering is preserved where it still applies |
| F1.1 language hierarchy (State -> District -> Mother Tongue -> Speech Variety -> ASR Model) | Already pan-India in shape; this addon supplies the data and tiering that populate it |
| C1, C2, C3, M1, M4, H1, H6, H7 | Each is **extended**, not relaxed (see A6 and A9) |

### A1.5 Honest limits of this document

- India's notified SC entries number in the **low thousands across states when counted entry by entry** (roughly 1,200+, varying by how synonyms and sub-groups are counted and by amendments). This document does not reproduce them. It specifies how to **load and maintain them from the official notified list** (A4) and gives an illustrative seed per state (A5).
- The community names in A5 are **illustrative examples** to show the shape of the data. They must be replaced by the official notified list for each state before any wave goes live.
- Language support for ASR/TTS changes quickly. Every tier assignment in A3 and A5 must be **re-verified against Bhashini and AI4Bharat coverage at the start of each wave**.

---

## A2. Design Principles for Pan-India Coverage

1. **Language is not caste, and caste is not language.** SC communities are not linguistic groups. A Chamar/Jatav family in Uttar Pradesh speaks Hindi or Bhojpuri; a Madiga family in Telangana speaks Telugu. Language is determined by **location and mother tongue (F1.1)**; the system never infers community from language, or language from community.
2. **Community is never asked by default.** The voice interview does not ask for caste or community unless a specific scheme pathway needs it, and then only as an **optional, separately consented** question (A4.3). Most recommendations work from state, district, education, and occupation alone.
3. **Never enable a language on the strength of a language swap.** A language goes live in voice-first mode only after it passes the same per-slot WER gates as Marathi and Hindi (C1). Until then it runs in a safer mode (A3.3), not a degraded-quality voice mode.
4. **Nobody is left without a path.** A caller whose language has no ASR still gets service: DTMF with pre-recorded prompts, or a human counsellor callback in their language.
5. **Dignity in wording.** Prompts use official, respectful terminology, reviewed by community members (A8, step 4). The system never volunteers a caste name, and never echoes a derogatory term.
6. **Migrants are first-class users.** A worker from Bihar living in Pune is not a Marathi speaker. Language is asked and confirmed separately from district of residence, and the telephone circle is only a weak prior.
7. **Additive, feature-flagged, reversible.** Every state and language is a configuration row with a flag. Switching one off must not affect any other.
8. **Compliance scales with the data.** Each wave gets its own DPIA addendum (C3) before data collection starts in that wave.

---

## A3. Language Coverage Architecture

*Extends F1.1, F1.2, F2.1, M1, M4, H1.*

### A3.1 Three language tiers

Every (language, speech variety) pair is assigned one tier and one **voice mode**:

| Tier | Definition | Default voice mode | Enablement rule |
|---|---|---|---|
| **A - Full voice** | Language with production-grade ASR and TTS available via Bhashini / AI4Bharat (IndicConformer, IndicWhisper, IndicTTS) | `voice_first` once gated | Must pass per-slot WER on local rural speech (C1) before `voice_first` is switched on; until then `dtmf_first` |
| **B - Assisted voice** | Non-scheduled language or regional variety with weak or no production ASR; closest Tier A language used as a best-effort engine | `dtmf_first` | Fine-tuning corpus collected per H1 method; promoted to Tier A behaviour only after passing the slot targets |
| **C - Human / DTMF only** | Small-population languages or varieties with no usable ASR/TTS | `human_assisted` | Pre-recorded prompts voiced by native speakers; DTMF answers; callback by a human counsellor in that language |

The voice mode is stored per language-variety in `state_language_map.voice_mode` (A4.2), so promotion from B to A is a data change, not a code change.

### A3.2 The 22 Eighth Schedule languages

| Language | Script | Principal SC-relevant states / UTs | Notes |
|---|---|---|---|
| Hindi | Devanagari | UP, Bihar, MP, Rajasthan, Haryana, Delhi, Uttarakhand, HP, Chhattisgarh, Jharkhand | Bridge language across the Hindi belt; base plan already covers it |
| Marathi | Devanagari | Maharashtra, Goa, border areas | Base plan pilot language |
| Bengali | Bengali | West Bengal, Tripura, Assam (Barak Valley), Jharkhand | Large SC population in West Bengal |
| Telugu | Telugu | Andhra Pradesh, Telangana, border districts of neighbouring states | |
| Tamil | Tamil | Tamil Nadu, Puducherry | |
| Gujarati | Gujarati | Gujarat, Dadra & Nagar Haveli and Daman & Diu | |
| Kannada | Kannada | Karnataka | |
| Malayalam | Malayalam | Kerala, Mahe (Puducherry) | |
| Odia | Odia | Odisha | |
| Punjabi | Gurmukhi | Punjab, Chandigarh, Haryana, Delhi, HP | Very high SC share of state population |
| Assamese | Assamese (Bengali-Assamese) | Assam | |
| Urdu | Perso-Arabic (Nastaliq) | UP, Bihar, Telangana, J&K, Delhi | Mostly a second language for SC users; needed for mixed-language districts |
| Maithili | Devanagari | Bihar, Jharkhand | |
| Santali | Ol Chiki (also Devanagari, Bengali, Odia in practice) | Jharkhand, Odisha, West Bengal | Script handling needs care for SMS (A6) |
| Konkani | Devanagari / Roman / Kannada scripts | Goa, Karnataka coast, Maharashtra coast | Multiple scripts in use by region |
| Dogri | Devanagari | Jammu region | |
| Kashmiri | Perso-Arabic | Kashmir valley | Small SC population |
| Nepali | Devanagari | Sikkim, Darjeeling hills (West Bengal) | |
| Sindhi | Devanagari / Perso-Arabic | Gujarat (Kutch region), Rajasthan, Maharashtra pockets | |
| Bodo | Devanagari | Assam | |
| Manipuri (Meitei) | Meitei Mayek / Bengali | Manipur | Very small SC population |
| Sanskrit | Devanagari | - | **Not applicable** as a voice-service language; excluded from ASR/TTS scope |

### A3.3 Major non-scheduled languages and varieties to onboard

These are the spoken varieties that Census C-16 mother-tongue tables show as large among rural and SC populations, and that Hindi, Bengali, or other scheduled-language ASR will handle poorly. Start them at Tier B and promote through data collection.

| Region | Varieties |
|---|---|
| Hindi belt - east | Bhojpuri, Magahi, Angika, Bajjika, Awadhi, Khortha, Nagpuri/Sadri |
| Hindi belt - centre & west | Braj, Bundeli, Bagheli, Malvi, Nimadi, Chhattisgarhi, Haryanvi |
| Rajasthan | Marwari, Mewari, Dhundhari, Hadoti, Mewati, Bagri (collectively "Rajasthani") |
| Hills | Pahari varieties of Himachal (Kangri, Mandeali, Kullvi, Chambyali), Garhwali, Kumaoni, Jaunsari |
| West | Kutchi, Varhadi, Ahirani/Khandeshi (Maharashtra; Varhadi already in base plan evaluation set) |
| South | Tulu, Kodava, Lambani/Banjara (Gor-Boli) |
| East & North-East | Sambalpuri/Kosli (Odisha), Sylheti (Assam, Tripura), Kokborok (Tripura) |

### A3.4 Language selection logic (extends M1)

The base plan opens with a **bilingual** greeting and detects language from the first three utterances. At national scale this generalises as follows:

- **Configurable greeting set per district.** The opening greeting uses the top 2 (maximum 3) languages for that district from `district_language_mix` (A4.2), built from Census C-16 data. Example: a Patna-district call opens in Hindi and Maithili; a Kolkata-district call in Bengali and Hindi.
- **Constrained language identification.** Language ID runs only against the district's candidate set plus Hindi and English, never against all 22+ languages at once. This keeps detection confidence high on short, code-mixed utterances.
- **Ask, don't assume, for migrants.** If the district of residence differs sharply from the detected language (for example, Telugu detected in a Pune call), the system confirms: "Shall we continue in Telugu?" Telephone circle (the caller's registered telecom circle) is a prior only, because migrants frequently hold SIMs from their home state.
- **Audio language menu as the fallback.** If three utterances do not reach the 0.85 detection confidence threshold from M1, offer a short spoken menu in the top candidate languages (press 1, 2, 3). This is an exception to the base plan's preference for no menu, and only applies after detection has failed.
- **Mid-session switching** is retained (M1), limited to languages in the candidate set.

### A3.5 Fallback when a language has no ASR (extends M4)

- Tier B and C languages skip straight to `dtmf_first` or `human_assisted` mode; they do not fail over through ASR tiers that do not support them.
- Google Cloud Speech-to-Text hot standby (M4) only covers the languages Google supports. The per-language standby availability is recorded in `state_language_map.standby_asr` and verified at each wave start; where there is no standby, DTMF-only is the tier-2 fallback.

---

## A4. SC Community Registry & Data Model Additions

*Extends B1.1, B1.2, B3.1, F2.2, and Section 11 (Database Preparation Checklist).*

### A4.1 Why a registry, not a list

The notified SC list is **state-specific**: a community can be an SC in one state and not in another, the same community can go by different names in different states, and the list is amended by Parliament from time to time. The registry therefore stores the notified list as versioned data, with aliases and transliterations, so the dialogue and analytics layers never hard-code community names.

### A4.2 New tables (additive; no change to existing tables)

```sql
-- Reference data (not personal data)
sc_community_registry (
  community_id        TEXT PRIMARY KEY,
  state_code          TEXT NOT NULL,        -- LGD state/UT code
  notified_name_en    TEXT NOT NULL,
  notified_name_local TEXT,
  script              TEXT,
  aliases             TEXT[],               -- synonyms, spelling variants, transliterations
  parent_group        TEXT,                 -- for aggregate reporting and small-group pooling
  order_reference     TEXT,                 -- notification / amendment act reference
  active              BOOLEAN DEFAULT TRUE,
  last_reviewed_at    TIMESTAMPTZ
);

state_language_map (
  state_code     TEXT,
  language_code  TEXT,                      -- ISO 639-3 where no 2-letter code exists (e.g. bho, mag, tcy)
  role           TEXT,                      -- primary | secondary | regional_variety
  tier           CHAR(1),                   -- A | B | C (A3.1)
  voice_mode     TEXT,                      -- voice_first | dtmf_first | human_assisted
  standby_asr    BOOLEAN,
  sms_script     TEXT,
  tts_available  BOOLEAN,
  last_verified_at TIMESTAMPTZ,
  PRIMARY KEY (state_code, language_code)
);

district_language_mix (
  lgd_district_code TEXT,
  language_code     TEXT,
  census_share      NUMERIC,                -- from Census C-16 mother-tongue tables
  source_year       INT,
  PRIMARY KEY (lgd_district_code, language_code)
);

-- Personal data: separate, access-restricted, keyed like every other profile table
beneficiary_community (
  phone_hash         TEXT PRIMARY KEY,      -- same HMAC-SHA256 key as beneficiary_profile
  community_id       TEXT REFERENCES sc_community_registry,
  declared_at        TIMESTAMPTZ,
  consent_ref        TEXT,                  -- links to the separate community-question consent (A4.3)
  purpose            TEXT                   -- which scheme pathway required it
);
```

### A4.3 Consent and handling for the community field

The community field is the most sensitive data point in the system (C3). The base plan's consent model (H7) is extended:

- **Not asked by default.** The field is only requested when a recommended pathway is community-specific (for example, a state SC development corporation scheme restricted to certain sub-groups).
- **Separate, explicit consent moment.** A distinct sentence: "To check a scheme meant for specific communities, may I ask which community you belong to? Press 1 to answer, 2 to skip." Skipping never blocks a recommendation.
- **Purpose-limited.** `purpose` records why it was collected; it is not reused for other analytics.
- **Stored apart.** `beneficiary_community` is its own table with its own access control list, column-level encryption, and mandatory audit-log entry on every read (C3).
- **No community in audio or transcripts.** The spoken community name is matched to the registry, then the raw transcript of that utterance is discarded (data minimisation, B3.1).
- **Not a special category in law, treated as one in practice.** The DPDP Act 2023 does not create a separate "sensitive personal data" class; this plan nonetheless treats community data as high-risk and says so in each DPIA addendum.

### A4.4 Profile JSON additions (schema v2.1, backward-compatible)

```json
{
 "language_detected": "bho",
 "language_confirmed_by_user": true,
 "dialect_tag": "western_bhojpuri",
 "voice_mode": "dtmf_first",
 "state_of_residence_lgd": "27",
 "state_of_origin_lgd": "09",
 "migrant_flag": true,
 "community_id": null,
 "community_consent_ref": null
}
```

All existing v2.0 fields remain unchanged. Fields not collected stay `null`. `migrant_flag` is derived (residence state differs from origin state, or detected language differs from the district's top languages); it is used to choose language and to route to destination-state opportunities, not to profile.

---

## A5. State and UT Coverage Matrix

*Extends F1.1 (language hierarchy), B1.2 (district and traditional-occupation mapping).*

**How to read this table.** "Illustrative SC communities" are examples of well-known notified communities, included to show the data shape. They are **not exhaustive and must be replaced by the official notified list** for that state (A4.1). "Voice languages" lists the main languages and varieties to support. Tier labels follow A3.1 and are **provisional** until re-verified at the start of the relevant wave.

### North

| State / UT | Illustrative SC communities | Voice languages (tier) | Notes |
|---|---|---|---|
| Uttar Pradesh | Chamar/Jatav, Pasi, Dhobi, Kori, Valmiki, Khatik | Hindi (A), Urdu (A), Awadhi (B), Bhojpuri (B), Braj (B), Bundeli (B) | Largest SC population of any state; highest operational load |
| Bihar | Chamar/Ravidas, Dusadh/Paswan, Musahar, Pasi, Dhobi, Bhuiya | Hindi (A), Maithili (A), Urdu (A), Bhojpuri (B), Magahi (B), Angika (B), Bajjika (B) | Many migrants out of state: apply A3.4 migrant logic |
| Jharkhand | Chamar/Ravidas, Dusadh, Bhuiya, Dom | Hindi (A), Santali (A), Bengali (A), Maithili (A), Khortha (B), Nagpuri/Sadri (B) | Santali script handling for SMS |
| Rajasthan | Meghwal, Bairwa, Jatav, Balai, Khatik, Regar | Hindi (A), Marwari (B), Mewari (B), Dhundhari (B), Hadoti (B), Mewati (B), Bagri (B) | "Rajasthani" is not a single ASR target; treat each variety separately |
| Madhya Pradesh | Chamar/Jatav/Ahirwar, Balai, Basor, Mehra/Mahar, Kori | Hindi (A), Bundeli (B), Bagheli (B), Malvi (B), Nimadi (B), Marathi (A, south-west border) | |
| Chhattisgarh | Satnami (Chamar), Mahar, Ghasia, Dhobi | Hindi (A), Chhattisgarhi (B) | |
| Haryana | Chamar, Balmiki, Dhanak | Hindi (A), Haryanvi (B), Punjabi (A) | |
| Punjab | Mazhabi Sikh, Ravidasia/Ad Dharmi, Balmiki, Chamar | Punjabi (A), Hindi (A) | One of the highest SC shares of state population |
| Himachal Pradesh | Koli, Chamar, Julaha (Weaver), Dumna | Hindi (A), Pahari varieties (B), Punjabi (A) | Hill terrain; low telecom coverage pockets |
| Uttarakhand | Koli, Dhobi, Chamar/Jatav | Hindi (A), Garhwali (B), Kumaoni (B), Jaunsari (B/C) | |
| Jammu & Kashmir | Megh, Batwal, Chamar, Balmiki | Dogri (A), Kashmiri (A), Urdu (A), Hindi (A), Punjabi (A), Pahari (B) | |
| Ladakh | None or negligible (confirm against notified list) | Ladakhi/Bhoti (C), Hindi (A) | Minimal-configuration mode (A8) |
| Delhi | Chamar/Jatav, Valmiki, Dhobi | Hindi (A), Punjabi (A), Urdu (A) | Large migrant inflow: apply A3.4 |
| Chandigarh | Chamar/Ad Dharmi, Balmiki | Hindi (A), Punjabi (A) | |

### West

| State / UT | Illustrative SC communities | Voice languages (tier) | Notes |
|---|---|---|---|
| Maharashtra | Mahar (incl. Buddhist converts), Matang, Chambhar, Dhor, Mochi, Bhangi | Marathi (A), Hindi (A), Varhadi (B), Ahirani/Khandeshi (B), Konkani (A, coast) | **Base plan pilot state**; this addon only adds the remaining varieties and districts |
| Gujarat | Vankar, Chamar, Valmiki, Rohit, Senma | Gujarati (A), Kutchi (B), Sindhi (A), Hindi (A) | |
| Goa | Mahar, Chambhar and others | Konkani (A), Marathi (A), Hindi (A) | Multiple Konkani scripts |
| Dadra & Nagar Haveli and Daman & Diu | Small SC population | Gujarati (A), Hindi (A), Marathi (A) | Minimal-configuration mode |

### South

| State / UT | Illustrative SC communities | Voice languages (tier) | Notes |
|---|---|---|---|
| Andhra Pradesh | Mala, Madiga, Adi Andhra, Relli | Telugu (A), Urdu (A) | Sub-categorisation of SCs is a live policy issue; see A11 |
| Telangana | Madiga, Mala, Relli | Telugu (A), Urdu (A), Hindi (A) | Base roadmap Phase 4 state |
| Karnataka | Holeya/Chalavadi, Madiga, Bhovi, Banjara/Lambani, Koracha | Kannada (A), Tulu (B), Konkani (A), Kodava (B/C), Lambani/Gor-Boli (C), Urdu (A) | Sub-categorisation is a live policy issue; see A11 |
| Tamil Nadu | Paraiyar, Pallar, Arunthathiyar, Adi Dravida | Tamil (A), plus Telugu and Kannada in border districts (A) | Base roadmap Phase 4 state; community partner engaged from Month 3 (base plan M7) |
| Kerala | Pulayan, Parayan, Kuravan, Cheramar | Malayalam (A), plus Tamil and Kannada in border districts (A) | |
| Puducherry | Adi Dravida, Paraiyar and others | Tamil (A), Malayalam (A, Mahe), Telugu (A, Yanam) | Enclaves in different language regions |
| Andaman & Nicobar Islands; Lakshadweep | None or negligible (confirm against notified list) | Hindi (A), Bengali/Tamil/Malayalam as applicable | Minimal-configuration mode (A8) |

### East

| State / UT | Illustrative SC communities | Voice languages (tier) | Notes |
|---|---|---|---|
| West Bengal | Rajbanshi, Namasudra, Bagdi, Poundra, Bauri, Chamar | Bengali (A), Hindi (A), Urdu (A), Nepali (A, hills), Sadri (B) | Second-largest SC population by count |
| Odisha | Pana, Dom, Bauri, Chamar/Mochi | Odia (A), Sambalpuri/Kosli (B), Bengali (A), Telugu (A, south), Hindi (A) | |
| Assam | Namasudra, Muchi/Rishi, Bansphor and others | Assamese (A), Bengali (A), Sylheti (B), Bodo (A), Hindi (A), Sadri/Nagpuri (B, tea-garden belt) | |
| Tripura | Namasudra, Dhoba, Muchi and others | Bengali (A), Kokborok (B/C) | |
| Manipur | Small SC population (confirm against notified list) | Manipuri/Meitei (A), Bengali (A) | Minimal-configuration mode |
| Sikkim | Small SC population (confirm against notified list) | Nepali (A), Hindi (A) | Minimal-configuration mode |
| Meghalaya, Mizoram, Nagaland, Arunachal Pradesh | None or very small SC populations (confirm against notified list per state) | Local languages (C), Hindi/English | Minimal-configuration mode; verify notified list before assuming none |

---

## A6. Component-by-Component Changes to the Base Plan

Every change below is **additive**: a new data source, a new configuration row, or a wider test set. No v2.0 fix is weakened.

| Base section | Extension required for pan-India coverage |
|---|---|
| **F1.1 ASR & language architecture** | Populate the location-first hierarchy from `state_language_map` and `district_language_mix`; constrained language ID (A3.4); per-variety voice-mode flag (A3.1); hot-standby availability recorded per language (A3.5). Per-slot WER targets from C1 apply **unchanged** to every language before it leaves `dtmf_first`. |
| **F1.2 TTS & voice output** | Verify IndicTTS/Bhashini voice availability per language. Where none exists (Tier B/C), use **native-speaker pre-recorded prompt libraries**: the base plan's 50-phrase library is recorded per language, and dynamic elements (centre names, distances) fall back to short recorded templates plus number/place-name snippets. |
| **F2.1 Interview flow & consent** | Dialogue script per language (A8, step 3); migrant-aware language confirmation (A3.4); optional community consent moment (A4.3); the H7 consent script is re-reviewed by the DPDPA advisor for each new language, since translation can change legal meaning. |
| **F2.2 NER & profile** | Occupation, skill, and place NER extended to new languages; community matcher against `sc_community_registry` aliases; profile schema v2.1 (A4.4). Education-level mapping (e.g. "aathvee paas") re-done per language and region. |
| **F3.1 PWA / kiosk** | Regional-language UI strings and icons re-checked for cultural fit; fonts for all required scripts embedded for offline use (48-hour offline requirement stays); right-to-left rendering for Urdu, Kashmiri, and Sindhi-Arabic. |
| **F3.2 WhatsApp / IVR / SMS** | See "SMS and telecom" below. |
| **F3.3 Browser companion** | Localised UI strings shipped from the same shared module; Android PWA and extension share one translation bundle. |
| **B1.1 NSQF database** | Add **state-level scheme layers**: state skill missions, State SC Development Corporations' schemes, and NSFDC channelising-agency offerings per state, flagged alongside PMKVY / PM-AJAY GIA / Stand-Up India / Mudra for preferential ranking. State-specific SC reservation and quota details in entry requirements. |
| **B1.2 District opportunity mapping** | Extend pre-population (MSME, ASI, employment exchange) from Maharashtra districts to all districts in a wave's states (district count follows the current LGD list). Traditional-occupation mapping extended per state from Census occupation tables and SC sub-plan data. |
| **B2.1 Skill-gap / RPL** | RPL pathway mapper extended to traditional occupations in each region (leatherwork, weaving, pottery, sanitation, agriculture, construction, fishing-related trades, and so on). The RSETI referral workflow (H4) is replicated per district; in states without RSETI coverage, the equivalent district skilling office is named in the partner agreement. |
| **B2.2 Recommendation engine** | State-specific weights tuned by the state nodal officer within the existing +/-10% limit; diversity constraint (C2) unchanged; bias audit extended per A9. |
| **B3.1 Security & privacy** | `beneficiary_community` table with its own ACL and column-level encryption (A4.3); per-wave DPIA addendum; data-residency posture re-confirmed with the Ministry before multi-state rollout (M2). |
| **B3.2 Admin dashboard** | State, district, and language breakdowns; **small-cell suppression** so aggregate views never expose individuals in small communities (A9.3); state-level RBAC roles (state planner sees only their state, Ministry sees all). |
| **I1.1 IVR & session infrastructure** | National toll-free number with language-based routing, or per-state numbers (decision in A11); call-volume sizing per wave; per-language DTMF scripts. |
| **I1.2 PWA/kiosk, SMS, operator certification** | Operator training video produced in each wave's primary languages; certification quiz localised; re-certification trigger on operator turnover (Section 10 watch list) applies to every state. |
| **I2.1 Multilingual testing** | Test corpus per language-variety (A9.1); dialect WER reports per state. |
| **I2.2 Recommendation & UX testing** | Synthetic personas extended to cover each wave's states, languages, and communities; 5-person usability test repeated per language group (A9.2). |
| **I3.2 Evaluation & scale roadmap** | The base plan's 4-phase roadmap is replaced for scale purposes by the wave plan in A7; the counterfactual-evaluation design (H8) repeats per wave. |

### SMS and telecom (extends F3.2, I1.2)

- **DLT template registration.** In India, commercial SMS requires sender and template registration with the telecom operators (the DLT framework). Each regional-language 3-line summary template must be registered **per language and script** before launch. Start this at the beginning of each wave; approval lead times can block go-live.
- **Unicode SMS length.** Indic scripts send as Unicode, which fits far fewer characters per SMS segment than English, so the "3 lines" summary may span several segments. Budget per-message cost accordingly, and keep the template short.
- **Script fallback.** If a device cannot render a script (older feature phones), send the summary as a **voice call-back with the same content** rather than a garbled SMS.
- **Language of the SMS** follows the confirmed language of the call, not the telephone circle.

---

## A7. Rollout Waves & Exit Gates

*Replaces the scale sequencing in base plan I3.2 for the purposes of this addon; preserves its principle (M7) that each state is a research phase, not a language swap.*

### A7.1 Wave plan

Timing is relative to the **end of the Pune pilot (Week 8)**. Wave ordering balances three factors: SC population size, ASR readiness, and shared language (a Hindi-belt wave reuses the Hindi stack). **Sequencing is a decision for the Ministry and the team; this is a proposed default.**

| Wave | Indicative window | States / UTs | Languages (primary focus) | Why this order |
|---|---|---|---|---|
| **Wave 0** | Weeks 1-8 (base plan) | Maharashtra - Pune district | Marathi, Hindi | Pilot; unchanged |
| **Wave 1** | Months 3-6 after pilot | Maharashtra-wide, Gujarat, Madhya Pradesh, Chhattisgarh, Rajasthan, Delhi, Haryana, Punjab | Marathi, Hindi, Gujarati, Punjabi; Tier B begins for Malvi, Chhattisgarhi, Rajasthani varieties, Haryanvi | Reuses Hindi and Marathi stacks; large SC populations; closest to pilot team and partners |
| **Wave 2** | Months 6-10 | Uttar Pradesh, Bihar, Jharkhand, Uttarakhand, Himachal Pradesh, Jammu & Kashmir | Hindi, Maithili, Urdu, Santali, Dogri; Tier B for Bhojpuri, Awadhi, Magahi, Braj, Bundeli, Bagheli, Garhwali, Kumaoni, Pahari | Largest SC populations and heaviest load; most Tier B varieties, so longest data-collection effort |
| **Wave 3** | Months 8-14 | Tamil Nadu, Telangana, Andhra Pradesh, Karnataka, Kerala, Puducherry | Tamil, Telugu, Kannada, Malayalam; Tier B for Tulu | Matches the base roadmap's Tamil Nadu and Telangana intent; Dravidian-language stacks are largely Tier A |
| **Wave 4** | Months 12-18 | West Bengal, Odisha, Assam, Tripura, Manipur, Goa | Bengali, Odia, Assamese, Bodo, Manipuri, Konkani; Tier B for Sambalpuri, Sylheti | Different script families; Tier B for several varieties |
| **Wave 5** | Months 16-22 | Sikkim, Meghalaya, Mizoram, Nagaland, Arunachal Pradesh, Ladakh, Andaman & Nicobar, Lakshadweep, Dadra & Nagar Haveli and Daman & Diu, Chandigarh | As applicable (Nepali, local languages, Hindi) | Minimal-configuration mode; verify notified SC lists first |

Waves may overlap where the teams and partners are separate. These windows are **planning assumptions, not commitments**; they should be re-baselined after the Pune pilot results.

### A7.2 Exit gates (every state must pass before it goes live)

A state is switched on only when **all** of the following are true. Any failure keeps that state, or that language within it, in a safer mode (A3.1):

| Gate | Requirement | Base-plan anchor |
|---|---|---|
| G1 - Data | Official notified SC list loaded into `sc_community_registry`; district profiles pre-populated; state scheme layers loaded | B1.1, B1.2, H3 |
| G2 - Language | Each enabled language-variety passes per-slot WER targets on local rural speech, or runs in `dtmf_first` / `human_assisted` mode | C1, H1 |
| G3 - Dialogue | Script reviewed by at least 3 native speakers per language, including community reviewers; wording cleared against the dignity checklist (A8 step 4) | F2.1, A2 |
| G4 - Privacy | DPIA addendum signed off; consent scripts reviewed by DPDPA advisor in each language | C3, H7 |
| G5 - Fairness | Bias audit passed for the state (A9.3) | C2 |
| G6 - Operators | 100% of active operators certified in the state; re-certification trigger active | H6 |
| G7 - Partners | Signed agreement with the state nodal officer and at least one community partner | M7 |
| G8 - Channels | DLT templates approved; toll-free routing tested; failover tested with the state's languages | C5, M4 |
| G9 - Escalation | Human counsellor available in every enabled language, or a documented call-back arrangement | I3.1 |

---

## A8. Per-State Onboarding Protocol

*This is the concrete checklist behind M7's requirement that each state expansion be treated as an ethnographic research phase. Repeat for every state in every wave.*

**Step 1 - Load official data (Week 1-2 of the state's window).** Import the state's notified SC list into `sc_community_registry`; load Census C-16 district language shares into `district_language_mix`; import state skill-mission, State SC Development Corporation, and NSFDC channelising-agency scheme data.

**Step 2 - Engage partners before writing anything.** Secure the state nodal officer (skilling mission / PMKVY) and the State SC Development Corporation contact; identify at least one **community-rooted partner** (for example, an NGO working with SC communities, a university linguistics or sociology department, or a community-based organisation). This follows the Tamil Nadu precedent in the base plan (partner engaged from Month 3 of the Maharashtra pilot).

**Step 3 - Dialogue development with native speakers.** Write the dialogue script per language with local idioms, not translated from Marathi or Hindi. Use native speakers, compensated fairly, and include speakers who are themselves from SC communities. Test with at least 3 native speakers per language-variety.

**Step 4 - Dignity and terminology review.** Run each script through a community review panel against a checklist:
- Uses the official term and respectful phrasing; no slurs, no euphemisms that the community considers demeaning
- Never names a caste or community unless the beneficiary did first
- Avoids assuming occupation from community (no "Chamar, so leatherwork")
- Sanitation and other hazardous traditional occupations are never offered as a default path; the recommendation engine is configured to surface safer, mechanised, or alternative pathways (B2.1)

**Step 5 - Audio collection for Tier B varieties (H1 method).** Collect rural speech at camp events, transcribe, and build a dialect-tagged evaluation set; report WER per variety, never averaged across varieties. Plan for the time this takes; it was flagged as the likeliest schedule slip in the base plan (Section 10).

**Step 6 - Local opportunity research.** Map district-level opportunities, traditional occupations, and NSQF RPL pathways with the partners; identify the nearest RSETI or equivalent and the SSC assessment coordinators per district (H4).

**Step 7 - Compliance.** DPIA addendum for the state; consent script review per language; confirm data-residency posture (M2).

**Step 8 - Channel readiness.** Register DLT templates per language; configure IVR routing and language menus; test WhatsApp-to-IVR failover (C5) with state languages.

**Step 9 - Shadow period.** Run the state in `dtmf_first` or assisted mode with operator support for an initial period before switching any language to `voice_first`; measure Call 1 completion and ASR error by slot.

**Step 10 - Gate review.** Pass all gates G1-G9 (A7.2), then enable.

### Minimal-configuration mode (for states/UTs with no or very few SC residents)

For states where the notified SC list is empty or the population is very small (see A5):
- Verify the notified list first; do not assume.
- Load the registry rows that exist; default language set to Hindi/English plus the state's main language.
- Serve through the human-assisted path (helpline callback) rather than investing in full language development; promote only if demand appears.

---

## A9. QA, Bias Audit & KPI Extensions

### A9.1 Multilingual testing (extends I2.1)

- **Test set per language-variety.** The base plan uses 50 utterances per language across eight slots, which is about six per slot. That is acceptable for a pilot but too thin to gate national rollout. For each language-variety to leave `dtmf_first`, **recommend at least 300 utterances, with at least 30 per critical slot** (district, occupation), recorded with real village background noise on phone microphones. Treat this number as a proposed planning standard, to be confirmed by the ML lead.
- **Per-variety reporting.** WER is reported per language **and** per variety (for example, Bhojpuri variants in eastern UP vs western Bihar), never pooled.
- **Code-mix testing.** Hindi-English, Bengali-English, Tamil-English, and inter-variety mixes (for example, Maithili-Hindi) are tested, not only Marathi-English.
- **Migrant scenario tests.** Telugu speaker in a Pune district call; Bhojpuri speaker in a Mumbai call; verify that language confirmation (A3.4) triggers correctly.
- **Promotion rule.** A variety moves from Tier B (`dtmf_first`) to voice-first only when it meets the same per-slot targets as Tier A (C1). There is no relaxed target for lower-resource languages; instead they stay in the safer mode.

### A9.2 Usability testing (extends I2.2 and H2)

Repeat the 5-person rapid usability test **per language group per wave**, using real target-population users, measuring drop-off by slot; any slot with drop-off above 30% is redesigned before that language group goes live.

### A9.3 Bias audit and small-group handling (extends C2, C3)

- **Audit dimensions.** Recommendation distribution by gender, by state, by language, and by community parent-group, compared with the national NSQF enrolment pattern.
- **Small-group pooling.** Many communities have too few beneficiaries for a stable statistic. Audit at the `parent_group` level, and report confidence intervals rather than point estimates.
- **Small-cell suppression.** Any dashboard cell or exported statistic covering fewer than a configurable minimum number of people (suggested default: 20) is suppressed or merged upward. This protects members of small communities from re-identification (C3) and prevents misleading conclusions.
- **Community field not needed for the audit.** Because the community field is optional and sparse, the primary fairness audit relies on state, language, gender, and district-level SC-population indicators; the community-level audit uses only the subset who consented.
- **Recalibrate on failure.** Same rule as C2: if any audited sub-group's distribution is narrower than the national pattern, the model is recalibrated before that wave proceeds.

### A9.4 KPI extensions (extends I3.2 evaluation KPIs)

All base-plan KPIs apply to each wave, with targets reset after the pilot baseline is known. Additional KPIs:

| KPI | Measurement | Target |
|---|---|---|
| Language-routing accuracy | Share of sessions where the confirmed language matches the first-offered language | To be set from pilot baseline |
| Fallback-mode share | Share of sessions completed in `dtmf_first` or `human_assisted` mode, by language | Tracked; trending down as varieties are promoted |
| Variety promotion rate | Number of Tier B varieties promoted to voice-first per quarter | Tracked against wave plan |
| Migrant service rate | Share of migrant-flagged callers who complete Call 1 | >= overall Call 1 completion rate |
| Community-question skip rate | Share who skip the optional community question | Tracked; a very low skip rate may indicate pressure, a very high rate may indicate a trust or wording problem |
| Human-counsellor response time | Time from callback request to human contact, by language | Set per wave with partners |

---

## A10. Team, Partners & Operations

### A10.1 Why the six-person team cannot cover this alone

The base team (P1-P6) is sized for one district and two languages. Pan-India coverage needs **per-state language and field capacity** layered on top of the core team, not a larger copy of it. The core team owns architecture, models, and shared platforms; state capacity is partner-led.

### A10.2 Added roles (planning assumptions; sizes are to be set per wave)

| Role | Responsibility | Scaling unit |
|---|---|---|
| State Language Lead | Dialogue scripts, terminology review, native-speaker panel coordination for a language group | One per language group per wave |
| Community Partner Liaison | Keeps the community review panel running; escalation for wording or trust issues | One per state (or cluster of small states) |
| Field Audio Coordinator | Runs camp recordings, transcription pipeline, evaluation sets for Tier B varieties | One per Tier B-heavy wave (for example, Wave 2) |
| State Data Steward | Loads and refreshes the state's SC list, scheme layers, district profiles | One per wave |
| Human Counsellor Pool | Answers callbacks in each enabled language | Sized from call volume per language |
| Compliance Coordinator | DPIA addenda, consent script reviews, DLT registrations | One across waves |

Existing roles (P1-P6) keep their base-plan ownership; P1 owns the wave plan and gate reviews, P2 owns language tiering and WER gates, P3 owns dialogue governance, P4 owns the multi-state bias audit, P5 owns the registry and data layers, P6 owns channel rollout and operator certification.

### A10.3 Partners to engage per state

- State nodal officer for skilling (PMKVY / state skill mission) and state SC development corporation
- NSFDC channelising agency in the state
- District RSETI counsellors (or equivalent)
- Community-rooted organisation(s) and a university language or social-science department
- State CSC SPV or equivalent, for operator onboarding

### A10.4 Operations at multi-state scale

- **Infrastructure.** The Docker/Kubernetes/Terraform design (M2) already supports this; capacity is re-sized per wave (IVR concurrency, PgBouncer pool, Redis memory). Re-run the Section 11 Step 10 load test before each wave, sized for that wave's expected concurrency.
- **Regional operations windows.** Helpline hours and call-back scheduling follow local working hours and languages.
- **Release discipline.** Language packs, dialogue scripts, and registry data are versioned and released independently of the core application, so one state's correction never forces a platform release.

---

## A11. Addon Risk Register & Watch List

### A11.1 Risk register

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| **Caste-profiling or surveillance at national scale.** A national database of community data is a far larger target than a pilot's. | Critical | Community field optional, separately consented, stored apart, per-wave DPIA, aggregate-only dashboards, small-cell suppression (A4.3, A9.3) | P5, P1 |
| **Community inferred from language or vice versa.** A model or analyst quietly treats a language as a caste proxy. | High | Design principle A2.1; community never derived; language never asked via community; code-review and audit-log checks | P4 |
| **Enabling a language before its ASR is good enough.** Pressure to "cover everyone" leads to poor accuracy on critical slots. | High | Tiering and voice-mode flags; same WER gates as Marathi/Hindi (A3.1, A9.1) | P2 |
| **Terminology causes harm or offence.** A translated prompt uses a demeaning term, or names a caste unprompted. | High | Dignity checklist and community review panel (A8 step 4) | P3 |
| **Small-community invisibility.** Tiny communities are pooled or suppressed and then effectively ignored by the recommendation and reporting layers. | Medium-High | Pool only for statistics, never for service; every community is reachable in the registry; quarterly review of which communities appear in usage | P4, P5 |
| **Stale or wrong notified list.** The SC list is amended; the registry drifts. | Medium | Versioned registry with `order_reference` and `last_reviewed_at`; scheduled review; partner confirmation | P5 |
| **Hazardous traditional occupations promoted.** Recognition of traditional skills (B2.1) could steer people to work the scheme is trying to move them away from. | High | Engine configured not to offer hazardous occupations as default; alternative pathways surfaced; sanitation-worker pathways linked to rehabilitation and mechanisation schemes through the state partner | P4 |
| **Migrant misrouting.** A migrant is served in the wrong language or shown only home-state opportunities (or only destination-state ones). | Medium | A3.4 confirmation; `migrant_flag`; both-state opportunity view | P3, P5 |
| **DLT / SMS approval delays.** Template registration blocks go-live in a state. | Medium | Start registration at wave start (A6) | P6 |
| **Human-counsellor capacity shortfall.** Tier C and `human_assisted` modes overload a small counsellor pool. | Medium-High | Size from forecast by language; queue-time KPI (A9.4); partner counsellors | P6, P1 |
| **Ministry or state policy change.** Policies such as SC sub-categorisation differ between states and change. | Medium | State-level configuration of schemes and eligibility rules; nodal officer overrides (H3) | P1 |

### A11.2 Open decisions for the Ministry and team

1. **National toll-free number vs per-state numbers.** A single number with language routing is simpler to publicise; per-state numbers allow local branding and telecom-circle routing. Decide before Wave 1.
2. **Sub-categorisation of SCs.** Several states have, or are considering, sub-categorisation of SC communities for quotas or scheme access. The registry's `parent_group` supports it structurally, but the policy treatment must come from the state, not this system.
3. **Data residency for multi-state operation.** Reconfirm NIC MeghRaj or cloud-region requirements before any wave beyond Maharashtra (M2).
4. **Wave sequencing.** Confirm or amend A7.1 after the pilot baseline.
5. **Funding model for Tier B data collection.** Audio collection and native-speaker review carry real cost; decide whether this is funded from the GIA component, state partners, or grant sources.

### A11.3 Pre-build watch list (extends Section 10)

- **Tier B data collection is the schedule risk.** It was the tightest item in the pilot for one variety; Wave 2 alone contains more than ten Tier B varieties. Start audio collection a full wave ahead.
- **Standby ASR may not cover Tier B languages at all.** Confirm early; plan on DTMF as the real failover for those languages.
- **Language-code handling in tooling.** Many varieties lack two-letter ISO codes; ensure the profile JSON, database, and dashboards all use ISO 639-3 (or an internal code) consistently, or joins and filters will silently drop rows.
- **Font and rendering gaps on low-end Android devices** for less common scripts (Ol Chiki, Meitei Mayek); test on real devices, not emulators (extends the Section 10 browser-companion watch item).
- **Volume growth of the operator-assisted queue.** More languages and more states mean more supervisor review (H6); size the review queue per wave.

---

## A12. Database Checklist Deltas

*Extends Section 11 (Database Preparation Checklist). Apply these in addition to Steps 1-10.*

- **Step 1 (schema).** Add `sc_community_registry`, `state_language_map`, `district_language_mix`, and `beneficiary_community` (A4.2). Keep `beneficiary_community` separate from `beneficiary_profile` for the same reason identity is separated from profile: a different access list and stronger protection.
- **Step 2 (pseudonymisation).** `beneficiary_community` uses the same HMAC-SHA256 `phone_hash` key; confirm this extension with the DPIA reviewer.
- **Step 3 (indexes).** Add `state_language_map(state_code, voice_mode)` for routing lookups; `district_language_mix(lgd_district_code, census_share DESC)` for greeting-set selection; `sc_community_registry(state_code, active)` for community matching. Do not index `beneficiary_community` beyond its primary key; avoid creating a fast path for bulk queries on community.
- **Step 4 (connection pooling).** Re-size PgBouncer for the wave's concurrency (A10.4).
- **Step 5 (Redis vs Postgres rule).** Cache `state_language_map` and `district_language_mix` lookups in Redis with a TTL; Postgres remains the source of truth. Never cache `beneficiary_community` in Redis.
- **Step 7 (backups and retention).** The DPIA addendum must state the retention period for `beneficiary_community`, which may be shorter than other profile data; apply it to backups too.
- **Step 8 (migrations).** Alembic migrations touching `beneficiary_community` require the same second-reviewer rule as `beneficiary_identity` and `audit_log`.
- **Step 10 (load test).** Re-run per wave with expected concurrency and with multi-language traffic mixed, since language-specific ASR and TTS paths have different latency profiles.
- **New Step 11 - Reference-data refresh.** Schedule a periodic review of `sc_community_registry` (after any constitutional amendment to the SC list) and of `state_language_map.tier` and `voice_mode` (at each wave start and on Bhashini/AI4Bharat coverage changes); record each refresh in the audit log.

---

## A13. References

*These are in addition to the base plan's Section 12 references.*

1. **The Constitution (Scheduled Castes) Order, 1950, as amended - notified SC lists by state/UT** - Government of India (Ministry of Law and Justice / Ministry of Social Justice and Empowerment), obtain the current consolidated list from the official legislative and ministry portals.
2. **Census of India 2011 - Primary Census Abstract for Scheduled Castes** - state and district SC population and occupation data. https://censusindia.gov.in
3. **Census of India - C-16: Population by Mother Tongue** (base plan reference 2) - for district language shares (`district_language_mix`). https://censusindia.gov.in/nada/index.php/catalog/10191
4. **Eighth Schedule to the Constitution of India** - list of the 22 scheduled languages.
5. **Bhashini - National Language Technology Mission** (base plan reference 14) - ASR/TTS/translation coverage per language; re-verify each wave. https://bhashini.gov.in
6. **AI4Bharat - Indic Language Models and Speech Resources** (base plan reference 5) - IndicConformer, IndicWhisper, IndicTTS coverage. https://models.ai4bharat.org/
7. **NSFDC - National Scheduled Castes Finance and Development Corporation** (base plan reference 13) - state channelising agencies. https://www.nsfdc.nic.in
8. **LGD - Local Government Directory** (base plan reference 12) - state, district, and taluka codes. https://lgdirectory.gov.in
9. **TRAI / telecom operator DLT framework** - sender and template registration for commercial SMS in regional scripts (obtain current procedure from the operator being used).
10. **Digital Personal Data Protection Act, 2023** (base plan reference 10) - consent, purpose limitation, and erasure obligations for the community field.

---

*Addon A - version 1.0. Additive to PM-AJAY Implementation Plan v2.0 (Hardened); no base-plan requirement is modified.* 
*Optional one-line cross-reference for the base plan (Section 1 and item M7): "Pan-India SC community and regional-language expansion is specified in Addon A."*
