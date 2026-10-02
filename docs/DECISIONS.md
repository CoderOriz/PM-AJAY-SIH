# DECISIONS.md

ADR-style records for decisions that depart from `SPEC.md`/`tasks.yaml`. Newest last.

## D1 — Demo scale: SQLite, not the pinned Postgres/Redis stack
- **Decision:** backend runs on a single-file SQLite DB (`backend/pmajay.db`, gitignored); no Redis, PgBouncer, or Docker.
- **Why:** SIH demo; keeps the stack to fastapi + uvicorn only.
- **Pilot swap:** PostgreSQL 16 + Redis per SPEC s2; the `phone_hash`/resume logic carries over.
- **Status:** accepted (2026-10-02)

## D2 — Evolve the existing app instead of the `src/pmajay` layout
- **Decision:** keep `frontend/` (React 19 + Vite) and `backend/` as-is; do not create the SPEC's `src/pmajay/` package tree or `web/pwa`.
- **Why:** the repo predates the SPEC layout and the working demo is the implementation; rebuilding in parallel would duplicate it.
- **Status:** accepted (2026-10-02, user choice)

## D3 — Web-only channels (Web Speech API), no IVR/SMS/WhatsApp vendors
- **Decision:** voice input/output via the browser's Web Speech API (`frontend/src/voice.js`); no telephony/SMS/WhatsApp integrations.
- **Why:** demo scope; vendor channels need credentials plus DLT/Meta approvals (HUMAN_TASKS HT-02/03/04).
- **Status:** accepted (2026-10-02)

## D4 — Standalone test scripts, not pytest
- **Decision:** backend tests are plain scripts (`test_personas.py`, `test_addon_a.py`) run with `python`; no pytest suite.
- **Why:** zero extra dependencies; the pytest invariant suite belongs to the production stack (tasks T009+).
- **Status:** accepted (2026-10-02)

## D5 — Env-provided salt and DB path
- **Decision:** `PM_AJAY_SALT` / `PM_AJAY_DB` env vars override the defaults in `main.py` and `seed.py` (see `.env.example`); no dotenv dependency.
- **Why:** honours the `ponytail:` note ("env-provided secret before real data") without new dependencies.
- **Caveat:** changing `PM_AJAY_SALT` invalidates every stored session's `phone_hash` — existing sessions stop resuming.
- **Status:** accepted (2026-10-02)
