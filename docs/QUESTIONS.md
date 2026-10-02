# QUESTIONS.md

Open questions. Format: context, options, recommended default, what happens meanwhile.

## Q1 — When does the SQLite → PostgreSQL/Redis migration happen?
- **Context:** SPEC s2 pins PostgreSQL 16 + Redis 7; the demo runs on SQLite (DECISIONS D1).
- **Options:** (a) after SIH, before pilot prep; (b) only when multi-user load demands it.
- **Recommended default:** (a) — pilot data should not live in a demo-grade DB.
- **Meanwhile:** nothing blocks; the schema is small enough to migrate with a script.

## Q2 — Reference data is synthetic: when does real data land?
- **Context:** `seed.py` QP codes (`AMH/Q0001`-style), centre phones (`020-27xxxxxx`), and coordinator phones (crc32-derived) are generated, not verified against NCVET/LGD/SSC registries.
- **Options:** import real NCVET QP data + a phone-verified centre list (HUMAN_TASKS HT-06/07), or keep synthetic for the demo.
- **Recommended default:** keep synthetic until the pilot; the real import is a human-gated task.
- **Meanwhile:** the recommender stays advisory-only, so synthetic QP codes carry no eligibility consequence.

## Q3 — Admin endpoints have no auth — when is RBAC added?
- **Context:** `/admin/*` is open (`ponytail:` demo only); SPEC s15 pins JWT + RBAC roles.
- **Options:** add before any non-local deployment; keep open for the local demo.
- **Recommended default:** add JWT + RBAC before the first deployment anywhere.
- **Meanwhile:** never expose the demo backend beyond localhost.
