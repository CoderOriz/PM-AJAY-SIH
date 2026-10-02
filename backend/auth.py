"""Admin auth (Q3/RBAC): PBKDF2 password check + minimal HS256 JWT.
Stdlib only — no pyjwt dependency (docs/DECISIONS.md D6). Demo users are
ensured in main.py; swap to pyjwt/OAuth IdP + a real user store at pilot."""
import base64
import hashlib
import hmac
import json
import os
import time

JWT_SECRET = os.environ.get("PM_AJAY_JWT_SECRET") or "pmajay-demo-jwt-secret"
PBKDF2_ITERATIONS = 100_000
TOKEN_TTL_S = 8 * 3600  # one working shift


def hash_password(password: str) -> str:
    """PBKDF2-HMAC-SHA256, stored as '<salt_hex>$<hash_hex>'."""
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split("$")
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(),
                                     bytes.fromhex(salt_hex), PBKDF2_ITERATIONS)
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, AttributeError):
        return False


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(segment: str) -> bytes:
    return base64.urlsafe_b64decode(segment + "=" * (-len(segment) % 4))


def make_token(username: str, role: str) -> str:
    """Minimal HS256 JWT: sub + role + exp."""
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64(json.dumps({"sub": username, "role": role,
                               "exp": int(time.time()) + TOKEN_TTL_S}).encode())
    signature = _b64(hmac.new(JWT_SECRET.encode(), f"{header}.{payload}".encode(),
                              hashlib.sha256).digest())
    return f"{header}.{payload}.{signature}"


def verify_token(token: str) -> dict | None:
    """Payload dict, or None for forged/expired/malformed tokens."""
    try:
        header, payload, signature = token.split(".")
        expected = _b64(hmac.new(JWT_SECRET.encode(), f"{header}.{payload}".encode(),
                                 hashlib.sha256).digest())
        if not hmac.compare_digest(expected, signature):
            return None
        data = json.loads(_unb64(payload))
        if int(data.get("exp", 0)) < time.time():
            return None
        return data
    except (ValueError, KeyError):
        return None
