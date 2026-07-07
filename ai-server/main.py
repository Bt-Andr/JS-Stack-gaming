import hashlib
import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logger = logging.getLogger("fsq-ai-server")

app = FastAPI(title="FSQ AI Stub Server")

AI_PROVIDER = os.getenv("AI_PROVIDER", "stub").strip().lower()
AI_UPSTREAM_URL = os.getenv("AI_UPSTREAM_URL", "").strip().rstrip("/")
AI_API_KEY = os.getenv("AI_API_KEY", "").strip()
AI_MODEL = os.getenv("AI_MODEL", "").strip()

# Comma-separated list of allowed origins, e.g. "https://my-app.vercel.app".
# Defaults to "*" for local dev; set AI_ALLOWED_ORIGINS in production.
_origins_env = os.getenv("AI_ALLOWED_ORIGINS", "*").strip()
ALLOWED_ORIGINS = ["*"] if _origins_env == "*" else [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if AI_PROVIDER != "stub" and not AI_API_KEY:
    logger.warning(
        "AI_PROVIDER=%s is set but AI_API_KEY is empty: this endpoint is an "
        "UNAUTHENTICATED public proxy to %s. Set AI_API_KEY before deploying "
        "publicly, especially if the upstream provider bills per request.",
        AI_PROVIDER, AI_UPSTREAM_URL or "(no upstream configured)",
    )
if ALLOWED_ORIGINS == ["*"]:
    logger.warning(
        "AI_ALLOWED_ORIGINS is not set: CORS allows any website to call this "
        "API from a visitor's browser. Set it to your deployed frontend's "
        "origin (e.g. https://my-app.vercel.app) in production."
    )

# Upstash Redis REST API — used as a schema-less key/value store for
# cross-device profile sync. No table, no migration: one JSON blob per account.
UPSTASH_URL = os.getenv("UPSTASH_REDIS_REST_URL", "").strip().rstrip("/")
UPSTASH_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "").strip()
ACCOUNT_RE = re.compile(r"^[a-zA-Z0-9_-]{3,32}$")


class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 256


class GenerateResponse(BaseModel):
    prompt: str
    answer: str


def _auth(x_api_key: Optional[str]) -> None:
    if not AI_API_KEY:
        return
    if not x_api_key or x_api_key != AI_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


async def _generate_stub(prompt: str, max_tokens: int) -> str:
    model_label = AI_MODEL or "stub-model"
    return f"[{model_label}] Réponse simulée pour: {prompt[:240]}"


async def _generate_ollama(prompt: str, max_tokens: int) -> str:
    upstream = AI_UPSTREAM_URL or "http://localhost:11434"
    payload = {"model": AI_MODEL or "llama3.1", "prompt": prompt, "stream": False, "options": {"num_predict": max_tokens}}
    async with httpx.AsyncClient(timeout=120) as client:
        res = await client.post(f"{upstream}/api/generate", json=payload)
        res.raise_for_status()
        data = res.json()
    return data.get("response", "")


async def _generate_openai_compatible(prompt: str, max_tokens: int) -> str:
    upstream = AI_UPSTREAM_URL
    if not upstream:
        raise HTTPException(status_code=500, detail="AI_UPSTREAM_URL is required for openai_compatible mode")
    payload = {
        "model": AI_MODEL or "local-model",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.4,
    }
    headers = {"Content-Type": "application/json"}
    api_key = os.getenv("AI_UPSTREAM_API_KEY", "").strip()
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    async with httpx.AsyncClient(timeout=120) as client:
        res = await client.post(f"{upstream}/chat/completions", json=payload, headers=headers)
        res.raise_for_status()
        data = res.json()
    choices = data.get("choices") or []
    if not choices:
        return ""
    return choices[0].get("message", {}).get("content", "") or ""


def _redis_configured() -> bool:
    return bool(UPSTASH_URL and UPSTASH_TOKEN)


async def _redis_get(key: str) -> Optional[str]:
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(f"{UPSTASH_URL}/get/{key}", headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"})
        res.raise_for_status()
        return res.json().get("result")


async def _redis_set(key: str, value: str) -> None:
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(
            f"{UPSTASH_URL}/set/{key}",
            headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"},
            content=value.encode("utf-8"),
        )
        res.raise_for_status()


def _hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode("utf-8")).hexdigest()


def _profile_key(account: str) -> str:
    return f"fsq:profile:{account}"


def _pin_key(account: str) -> str:
    return f"fsq:pin:{account}"


def _require_sync_configured() -> None:
    if not _redis_configured():
        raise HTTPException(
            status_code=503,
            detail="La synchronisation n'est pas configurée sur ce serveur (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN manquants).",
        )


def _validate_account(account: str) -> None:
    if not ACCOUNT_RE.match(account):
        raise HTTPException(status_code=400, detail="Nom de compte invalide (3 à 32 caractères : lettres, chiffres, - ou _).")


async def _check_pin(account: str, provided_pin: Optional[str]) -> None:
    stored_hash = await _redis_get(_pin_key(account))
    if stored_hash and (not provided_pin or _hash_pin(provided_pin) != stored_hash):
        raise HTTPException(status_code=403, detail="PIN invalide ou manquant pour ce compte.")


class ProfilePut(BaseModel):
    profile: Dict[str, Any]
    pin: Optional[str] = None


class ProfileGetResponse(BaseModel):
    profile: Optional[Dict[str, Any]] = None
    updatedISO: Optional[str] = None


@app.get("/api/v1/profile/{account}", response_model=ProfileGetResponse)
async def get_profile(account: str, x_profile_pin: Optional[str] = Header(default=None)):
    _require_sync_configured()
    _validate_account(account)
    await _check_pin(account, x_profile_pin)
    raw = await _redis_get(_profile_key(account))
    if raw is None:
        return ProfileGetResponse(profile=None, updatedISO=None)
    data = json.loads(raw)
    return ProfileGetResponse(profile=data.get("profile"), updatedISO=data.get("updatedISO"))


@app.put("/api/v1/profile/{account}")
async def put_profile(account: str, body: ProfilePut, x_profile_pin: Optional[str] = Header(default=None)):
    _require_sync_configured()
    _validate_account(account)
    stored_hash = await _redis_get(_pin_key(account))
    if stored_hash:
        await _check_pin(account, x_profile_pin)
    elif body.pin:
        # First write for this account with a PIN supplied: adopt it as the account's lock.
        await _redis_set(_pin_key(account), _hash_pin(body.pin))
    payload = json.dumps({"profile": body.profile, "updatedISO": datetime.now(timezone.utc).isoformat()})
    await _redis_set(_profile_key(account), payload)
    return {"ok": True}


@app.post("/api/v1/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest, x_api_key: Optional[str] = Header(default=None)):
    _auth(x_api_key)
    provider = AI_PROVIDER
    max_tokens = req.max_tokens or 256
    if provider == "ollama":
        answer = await _generate_ollama(req.prompt, max_tokens)
    elif provider in {"openai_compatible", "openai-compatible", "openai"}:
        answer = await _generate_openai_compatible(req.prompt, max_tokens)
    else:
        answer = await _generate_stub(req.prompt, max_tokens)
    return GenerateResponse(prompt=req.prompt, answer=answer)


@app.get("/healthz")
async def health():
    return {"status": "ok", "provider": AI_PROVIDER, "model": AI_MODEL or None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")
