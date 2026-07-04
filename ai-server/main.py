import os
from typing import Optional

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="FSQ AI Stub Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

AI_PROVIDER = os.getenv("AI_PROVIDER", "stub").strip().lower()
AI_UPSTREAM_URL = os.getenv("AI_UPSTREAM_URL", "").strip().rstrip("/")
AI_API_KEY = os.getenv("AI_API_KEY", "").strip()
AI_MODEL = os.getenv("AI_MODEL", "").strip()


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
