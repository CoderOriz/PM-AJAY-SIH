"""Vercel serverless entry: serves backend/main.py under /api on the same URL as the frontend.

Same Vercel project serves frontend/dist (static) + /api/* (this function),
so the deployed frontend calls same-origin /api/* with no extra hosting.
"""
import os
import sys

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# ponytail: ephemeral /tmp SQLite for the Vercel demo; sessions reset on cold
# start/redeploy — use an external DB (Neon/Supabase) or a hosted backend for persistence.
if os.environ.get("VERCEL") and not os.environ.get("PM_AJAY_DB"):
    os.environ["PM_AJAY_DB"] = "/tmp/pmajay.db"

from fastapi import FastAPI  # noqa: E402

from main import app as backend_app  # noqa: E402  (import after sys.path + env setup)

api = FastAPI()
api.mount("/api", backend_app)

app = api
