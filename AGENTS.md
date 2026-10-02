# AGENTS.md — PM-AJAY Voice Livelihood Assistant (SIH demo build)

Voice-first livelihood assistant for PM-AJAY (GIA) SC beneficiaries (SIH 2025, Pune pilot, Marathi + Hindi demo). **Advisory only**: nothing grants or implies a benefit decision; no Aadhaar anywhere in the code; community data never enters the main profile — it goes to a separate `beneficiary_community` table via the separately-consented `/session/{id}/community` endpoint.

**Reality check before planning anything:** the planning docs at the repo root (`SPEC.md`, `tasks.yaml`, `HUMAN_TASKS.md`) describe a much larger production architecture — `src/pmajay/` package tree, PostgreSQL + Redis, Docker, IVR/SMS/WhatsApp vendor channels, `make check` workflow. **None of that exists.** The actual code is the demo below, built from `PM_AJAY_Implementation_Plan_v2 (1).md` + the Addon A doc. Adapt plan items to this codebase instead of recreating the planned layout.

## Layout — standalone dirs; the root has only a Makefile + .env.example (no root package.json)
- `backend/` — single-file FastAPI app (`main.py`) on SQLite. `requirements.txt` is just fastapi + uvicorn.
- `frontend/` — React 19 + Vite 7 + Tailwind 4 (via `@tailwindcss/vite`). No router package — views switch on `location.hash` (`#admin` → Admin).
- `extension/` — Chrome MV3 companion (`popup.html` + `sidepanel.html` + `content.js`), plain JS, no build step.
- `remotion/` — walkthrough video. **Gitignored entirely — edits there cannot be committed.**
- `docs/` — process records: `ASSUMPTIONS.md` (plan assumptions from SPEC s20), `DECISIONS.md` (ADRs), `QUESTIONS.md` (open items). Record deviations from SPEC there.

## Commands — the raw commands work on this machine; the root Makefile wraps them (`make` is NOT installed on this Windows box)
```
# Backend — port 8000
cd backend && pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Frontend — Vite default port 5173
cd frontend && npm install
npm run dev
npm run build        # the frontend regression gate — must stay clean

# Backend tests — HTTP integration tests against the LIVE server:
# start the API first, then run them (they fail with connection refused otherwise)
cd backend && python test_personas.py    # 10-persona regression, must stay 10/10
cd backend && python test_addon_a.py     # Addon A / language-registry checks

# Remotion (local only)
cd remotion && npx tsc --noEmit
npx remotion render MainVideo out/video.mp4 --codec=h264 --crf=23 --concurrency=2 --overwrite  # >10 min — don't use a short timeout
```
- Makefile equivalents (same commands): `make setup` / `backend` / `frontend` / `build` / `test` / `check` (test + build — run before a commit) / `reset-db`.

## Architecture
- **Dialogue engine: `frontend/src/dialogue.js`** — `LANGS` registry (12 enabled voice languages: mr hi bn ta te gu kn ml or pa as ur), `SLOTS` questions, per-language packs. All user-facing dialogue copy lives here.
- **Session flow: `frontend/src/Beneficiary.jsx`** — slot/echo screens + TTS inactivity re-prompt (7.5 s idle → repeat the question or last answer, capped at 2 repeats per idle stretch; timer resets on typing, errors, navigation, mic).
- `frontend/src/voice.js` — Web Speech API, BCP-47 tags, graceful voice fallback. `frontend/src/api.js` — API base is `http://localhost:8000` unless the page itself is served from port 8000.
- Backend `main.py`: sessions keyed by `phone_hash` (SHA-256 over salt+phone), 48 h auto-resume, profile ingest filtered through the `ALLOWED_SLOTS` allow-list (unknown keys silently dropped), scorer = aspiration .40 / capability .30 / access .20 / scheme .10 + nodal-pin boost, top-3 diversity across ≥2 sectors, aspiration-override 4th card, admin aggregates with small-cell suppression (`SUPPRESS_MIN = 20` → `other_suppressed`).
- Seeders: `seed.py` creates + seeds `pmajay.db` (NSQF Qualification Packs, Pune centres, LGD districts); `seed_addon_a.py` is idempotent and auto-runs at import in `main.py` (owns `sc_community_registry`, `state_language_map` (77 rows), `district_language_mix`, `beneficiary_community`).

## Deliberate demo shortcuts — don't silently "fix"
Anything with a `ponytail:` comment is an intentional, recorded tradeoff: demo salt + DB path (env-configurable via `.env.example`, see `docs/DECISIONS.md` D5), wide-open CORS, no auth on admin endpoints (RBAC before pilot), static Pune market table, English-keyword synonyms only, deterministic coordinator phones, heuristic dropout risk. Changing one means committing to the pilot-scale replacement it defers to.

## Gotchas
- **No auth anywhere** (demo) — don't build beneficiary-visible features assuming session security exists.
- **Fresh clone:** `pmajay.db` is gitignored — run `make reset-db` (or `python seed.py` in `backend/`); core tables are not auto-created (only the Addon A tables are, at import).
- Changing `PM_AJAY_SALT` (`.env.example`) invalidates every stored session's `phone_hash` — existing sessions stop resuming. `PM_AJAY_DB` paths resolve relative to `backend/`.
- `seed.py` resets `pmajay.db` from scratch (`os.remove`) — re-running it **wipes all session data**; never run it against a DB with real data.
- Brand strings live in three places: `frontend/src/App.jsx` (header), `extension/manifest.json`, and the FastAPI title in `main.py`; the walkthrough video uses the "Saksham Sathi" name — keep them in sync if renaming.
- `*.png` is gitignored too (screenshots stay local). Commits go straight to `main`, style `Type: Description` (`Fix: …`, `Update: …`).
- `tasks.yaml` statuses are all `todo` and its acceptance commands (`make check`, `make invariants`) reference tooling that doesn't exist — see the reality check above before treating it as a work tracker.
