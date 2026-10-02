# HUMAN_TASKS.md - What only people can do

An AI agent can build the software, fakes, tests, tooling and documentation. It **cannot** obtain approvals, credentials, real data, legal sign-off, native-speaker judgement, field recordings, or staffing. This file lists those items, why they matter, what the agent does while waiting, and **exactly which artefact to hand back** so the agent is unblocked.

**Start the long-lead items (HT-01, 02, 03, 04, 06, 07) in Week 1.** They are external approvals or data requests that routinely take longer than software work and can silently block go-live.

---

## 1. The list

| ID | Human task | Why an agent can't do it | Typical long-lead? | Agent proceeds meanwhile with | Hand back (artefact -> path) |
|---|---|---|---|---|---|
| **HT-01** | Legal / DPDPA review: consent scripts (`consent.m1`, `consent.m2`, SMS mention), privacy notice, DPIA, breach plan; confirm retention periods | Legally meaningful; requires a qualified advisor | **Yes** | Drafts flagged `draft_unreviewed`; retention values as configurable defaults | Signed-off wording -> `content/prompts/consent.*.yaml` with `review_status: reviewed`; sign-off flags -> `data/reference/signoffs.yaml` |
| **HT-02** | Register SMS sender ID and **every template** under the telecom DLT framework, per language and script | Requires an entity account and operator approval | **Yes** | Templates with `dlt_template_id: null`; fake gateway | Approved IDs -> `dlt_template_id` fields in `content/sms/*.yaml` |
| **HT-03** | WhatsApp Business account, number, and message-template approval | Meta approval; business verification | **Yes** | Fake WhatsApp provider; `WA_*` template drafts | Credentials via secrets manager; approved template IDs -> `content/whatsapp/*.yaml` |
| **HT-04** | Choose telephony/IVR vendor (e.g. Exotel or Twilio); obtain credentials, sandbox numbers, toll-free number, missed-call number; **confirm missed-call-to-callback support** | Commercial decision + credentials | **Yes** | Fake telephony + `FakeCaller`; Protocol-only real adapter | Vendor name + API docs/sandbox keys (secrets manager); numbers -> `.env` / config |
| **HT-05** | Choose SMS vendors (primary + a **second** provider) and credentials | Commercial decision + credentials | Medium | Fake SMS provider with fault modes | Credentials via secrets manager; vendor docs |
| **HT-06** | Obtain official NCVET/NSDC QP data (Excel/CSV); confirm column mapping | Data access request | **Yes** | Synthetic QP fixtures | Files -> `data/reference/qp/`; edit `config/ncvet_columns.yaml` |
| **HT-07** | Training-centre list for pilot districts; **phone-verify each centre**; confirm whether a live PMKVY centre API exists and its terms | Real-world calls; API access | **Yes** | Synthetic centres; weekly verification routine tool | Verified file -> `data/reference/centres.csv` (with `last_verified_at`, phone, source) |
| **HT-08** | Collect and label rural Marathi/Hindi audio at camps (20-30 h target) for ASR evaluation and fine-tuning; dialect-tag it | Field work; consent from speakers | **Yes** | `tools/asr_eval.py` harness; ingest hooks | Labelled CSV + audio -> `data/reference/asr_eval/` (audio kept outside the repo; only labels in repo) |
| **HT-09** | Native-speaker review (>= 3 per language) of prompts, SMS texts, alias tables; **community review panel** against the dignity checklist (below) | Cultural/linguistic judgement | Medium | Machine-drafted text, always `draft_unreviewed` | Edited files with `review_status: reviewed` |
| **HT-10** | District data: MSME/ASI/NCS extracts, nodal-officer pins (3-5 courses), RSETI and SSC-assessment contacts, Mudra/Stand-Up data | Government data + relationships | Medium | Synthetic district fixtures | Files -> `data/reference/district/`; run `tools/import_district_data.py` |
| **HT-11** | Operator certification: 30-minute training video, 10-question quiz content, certify operators at each CSC | Content + people | Medium | Quiz module with sample questions | Quiz bank -> `content/operator_quiz.yaml`; certified operator list |
| **HT-12** | Usability tests with 5+ real users per channel (IVR, kiosk/PWA); test on real low-cost Android phones with battery saver | Real people, real devices | Medium | E2E tests on emulated throttled networks | Findings -> GitHub issues / `docs/usability-findings.md` |
| **HT-13** | Staffing: human counsellors (Marathi + Hindi) with published hours; on-call roster (>= 2 levels) | Hiring/assignment | Medium | Call-back queue + roster tables | Roster -> `oncall_roster` seed (encrypted phones via admin tool) |
| **HT-14** | Hosting decision: cloud region vs NIC MeghRaj; confirm data-residency with the Ministry (Week 1) | Policy decision | **Yes** | Cloud-agnostic Terraform/K8s | Decision recorded in `docs/DECISIONS.md` |
| **HT-15** | Reference data: national NSQF enrolment-by-sector (for the bias audit); GIA perspective-plan targets | Ministry data | Medium | Synthetic reference files | `data/reference/national_nsqf_enrolment_by_sector.csv`; targets CSV for `tools/import_gia_targets.py` |

---

## 2. Dignity and terminology checklist (HT-09 reviewers)

Review every spoken and written string against this before marking `reviewed`:

- Uses respectful, official terms; no slurs; no euphemisms the community finds demeaning.
- Never names a caste or community (the pilot does not ask; INV-17).
- Does not assume an occupation from a community or vice versa.
- Does not offer hazardous or stigmatised traditional work as a default path.
- Sounds like a helpful facilitator, not a government form: short, warm, spoken-style.
- Can be understood by someone with little schooling: no jargon (say "training course", not "qualification pack").
- An SMS would not embarrass the person if someone else read it.

---

## 3. Items that need a policy decision (agent will not decide these)

| Decision | Default the agent uses | Owner |
|---|---|---|
| Should WhatsApp stay supplementary (never the sole path)? | Yes - supplementary with automatic IVR/SMS failover | Ministry / programme lead |
| Collect gender to enable production fairness monitoring? | No (not collected) | DPO + Ministry |
| Randomised-recommendation (counterfactual) evaluation? | Off; needs consent design + ethics approval | Ministry + legal |
| Debug audio capture of real users? | Never; only allowlisted test numbers | DPO |
| National toll-free vs per-state numbers (later waves) | Single number for pilot | Ministry |
| Minimum cell size for dashboard aggregates | 10 for the pilot | DPO |

---

## 4. Handing the project to the agent

1. Create a repo with this folder's contents at the root (`AGENTS.md`, `tasks.yaml`, `docs/`).
2. Give the agent a sandbox with: Python 3.12, Node 20+, Docker (for Postgres/PostGIS, PgBouncer, Redis), `ffmpeg`, and network access to package registries. **Do not** give it production credentials.
3. Use this kickoff prompt:

> Read `AGENTS.md`, then `docs/SPEC.md`, then `tasks.yaml`. Follow `AGENTS.md` section 2 exactly. Start with the lowest-ID task whose dependencies are done and whose owner is `agent` or `joint`. After each task, run `make check`, update `tasks.yaml` with status and evidence, and commit on a `task/<ID>-<slug>` branch. Record assumptions in `docs/ASSUMPTIONS.md` and any open question in `docs/QUESTIONS.md` instead of guessing. Never invent real-world data, credentials, or phone numbers; use synthetic fixtures. Stop and ask when `AGENTS.md` section 2.3 says so. Begin with T001.

4. Review cadence: after M0, after M1 (engine produces valid packets), after M2 (IVR + SMS journeys pass), then per milestone. At each review check `make check`, `make invariants`, and read `docs/ASSUMPTIONS.md` and `docs/QUESTIONS.md`.
5. When real credentials/data arrive (HT items), place them as described above, then ask the agent to resume the `blocked_by_human` tasks.
6. Before the pilot: run `make pilot-gate`. It is **expected to fail** until every human gate above is closed; its report lists exactly which are open.
