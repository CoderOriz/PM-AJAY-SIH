# PM-AJAY demo dev commands (run from the repo root; Windows: Git Bash).
# `make reset-db` DESTROYS backend/pmajay.db (seed.py does os.remove) — fresh setups only.

.PHONY: setup backend frontend build test check reset-db

setup:        ## install backend + frontend deps
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

backend:      ## run the API on http://localhost:8000
	cd backend && python -m uvicorn main:app --reload --port 8000

frontend:     ## run the Vite dev server on http://localhost:5173
	cd frontend && npm run dev

build:        ## frontend production build — the regression gate, must stay clean
	cd frontend && npm run build

test:         ## HTTP integration tests — REQUIRE the API running first (make backend)
	cd backend && python test_personas.py
	cd backend && python test_addon_a.py

check: test build  ## everything that must pass before a commit

reset-db:     ## recreate + reseed pmajay.db — WIPES all session data
	cd backend && python seed.py
