"""Client PayMe (mobile money Cameroun, XAF) — port Python de l'intégration
K-Beauty décrite dans docs/export-contexte-paiement-payme.md.

Modèle : initiation (push USSD sur le téléphone du client) + polling du statut
jusqu'à un état terminal. La config (base_url, credentials) vit en base et se
modifie à chaud via l'admin ; seul le secret de chiffrement est en variable
d'environnement (PAYMENT_GATEWAY_ENCRYPTION_SECRET).
"""

import base64
import hashlib
import json
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

import httpx
import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException

import core

PROVIDER = "PAYME"
HTTP_TIMEOUT = 30.0
# Marge avant expiration du token au-delà de laquelle on réutilise la session.
TOKEN_REFRESH_MARGIN_S = 300
# Durée de vie supposée quand le JWT PayMe ne porte pas de claim exp.
DEFAULT_TOKEN_TTL_S = 1800

ENCRYPTION_SECRET = os.getenv("PAYMENT_GATEWAY_ENCRYPTION_SECRET", "").strip()

# Statuts provider (insensibles à la casse) → statuts internes.
STATUS_MAP = {
    "SUCCESS": "SUCCEEDED", "SUCCESSFUL": "SUCCEEDED", "SUCCEEDED": "SUCCEEDED",
    "PAID": "SUCCEEDED", "PAYMENT_SUCCESS": "SUCCEEDED", "PAYMENT_COMPLETED": "SUCCEEDED",
    "FAILED": "FAILED", "PAYMENT_FAILED": "FAILED", "ERROR": "FAILED",
    "EXPIRED": "EXPIRED", "PAYMENT_EXPIRED": "EXPIRED",
    "CANCELLED": "CANCELLED", "CANCELED": "CANCELLED",
    "PAYMENT_IN_PROGRESS": "PROCESSING", "PENDING": "PROCESSING",
    "INITIATED": "PROCESSING", "PROCESSING": "PROCESSING",
}
TERMINAL_STATUSES = {"SUCCEEDED", "FAILED", "EXPIRED", "CANCELLED"}


def map_status(provider_status: Optional[str]) -> str:
    return STATUS_MAP.get((provider_status or "").strip().upper(), "UNKNOWN")


# --- Chiffrement des secrets (AES-256-GCM) -----------------------------------
# Format stocké : base64(iv).base64(tag).base64(ciphertext) — compatible avec
# l'implémentation Node de K-Beauty (clé = SHA-256 du secret).

def _aes_key() -> bytes:
    if not ENCRYPTION_SECRET:
        raise HTTPException(status_code=503, detail="PAYMENT_GATEWAY_ENCRYPTION_SECRET n'est pas configurée sur ce serveur.")
    return hashlib.sha256(ENCRYPTION_SECRET.encode("utf-8")).digest()


def encrypt_secret(plain: str) -> str:
    iv = os.urandom(12)
    sealed = AESGCM(_aes_key()).encrypt(iv, plain.encode("utf-8"), None)  # ciphertext || tag(16)
    ciphertext, tag = sealed[:-16], sealed[-16:]
    return ".".join(base64.b64encode(part).decode("ascii") for part in (iv, tag, ciphertext))


def decrypt_secret(encoded: str) -> str:
    try:
        iv_b64, tag_b64, ct_b64 = encoded.split(".")
        iv, tag, ciphertext = (base64.b64decode(part) for part in (iv_b64, tag_b64, ct_b64))
        return AESGCM(_aes_key()).decrypt(iv, ciphertext + tag, None).decode("utf-8")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Impossible de déchiffrer les credentials PayMe (secret de chiffrement changé ?). Re-renseigne le mot de passe dans l'admin.")


# --- Téléphone (Cameroun) -----------------------------------------------------

def normalize_cm_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    while digits.startswith("237"):
        digits = digits[3:]
    digits = digits.lstrip("0")
    if len(digits) != 9:
        raise HTTPException(status_code=400, detail="Numéro Mobile Money invalide — attendu 9 chiffres (ex : 6XX XX XX XX).")
    return "237" + digits


# --- Appels HTTP PayMe ----------------------------------------------------------
# Toutes les réponses suivent l'enveloppe {success, message, data, status}.

async def _post(base_url: str, path: str, payload: Dict[str, Any], token: Optional[str] = None) -> Dict[str, Any]:
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{base_url.rstrip('/')}{path}"
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            res = await client.post(url, json=payload, headers=headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"PAYMENT_PROVIDER_UNREACHABLE: {e}")
    if not (200 <= res.status_code < 300):
        raise HTTPException(status_code=502, detail=f"PAYMENT_PROVIDER_HTTP_ERROR ({res.status_code}): {res.text[:300]}")
    try:
        body = res.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="PAYMENT_PROVIDER_INVALID_RESPONSE: corps non JSON.")
    if not isinstance(body, dict) or body.get("success") is not True:
        message = body.get("message") if isinstance(body, dict) else None
        raise HTTPException(status_code=502, detail=f"PAYMENT_PROVIDER_REJECTED_REQUEST: {message or json.dumps(body)[:300]}")
    data = body.get("data")
    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail="PAYMENT_PROVIDER_INVALID_RESPONSE: champ data manquant.")
    return data


async def payme_login(base_url: str, username: str, password: str) -> str:
    data = await _post(base_url, "/api/auth/login", {"user_name": username, "password": password})
    token = data.get("token")
    if not token or not isinstance(token, str):
        raise HTTPException(status_code=502, detail="PAYMENT_PROVIDER_INVALID_RESPONSE: token absent de la réponse login.")
    return token


async def payme_init_payment(base_url: str, token: str, amount: int, phone: str,
                             external_reference: str, client_fees_rate: int) -> Dict[str, Any]:
    data = await _post(base_url, "/api/transaction/init_payment", {
        "amount": amount,
        "phone": phone,
        "external_reference": external_reference,
        "client_fees_rate": client_fees_rate,
    }, token=token)
    if not all(data.get(k) for k in ("status", "gateway_reference", "external_reference")):
        raise HTTPException(status_code=502, detail="PAYMENT_PROVIDER_INVALID_RESPONSE: réponse d'initiation incomplète.")
    return data


async def payme_payment_status(base_url: str, token: str, gateway_reference: str) -> Tuple[str, Dict[str, Any]]:
    data = await _post(base_url, "/api/clients/transaction/payment_status",
                       {"gateway_reference": gateway_reference}, token=token)
    status = data.get("status")
    if not status:
        raise HTTPException(status_code=502, detail="PAYMENT_PROVIDER_INVALID_RESPONSE: statut absent.")
    return str(status), data


# --- Config & session (token) en base ------------------------------------------

async def get_config(masked: bool = True) -> Optional[Dict[str, Any]]:
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM payment_gateway_configs WHERE provider = $1", PROVIDER)
    if row is None:
        return None
    config = dict(row)
    if masked:
        config["hasPassword"] = bool(config.pop("password_encrypted", ""))
    return config


def _decode_token_times(token: str) -> Tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    issued_at, expires_at = now, now + timedelta(seconds=DEFAULT_TOKEN_TTL_S)
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
        if claims.get("iat"):
            issued_at = datetime.fromtimestamp(int(claims["iat"]), tz=timezone.utc)
        if claims.get("exp"):
            expires_at = datetime.fromtimestamp(int(claims["exp"]), tz=timezone.utc)
    except jwt.PyJWTError:
        pass
    return issued_at, expires_at


async def _store_session(status: str, token: Optional[str] = None, error: Optional[str] = None) -> None:
    pool = await core.get_pool()
    encrypted = encrypt_secret(token) if token else None
    issued_at, expires_at = _decode_token_times(token) if token else (None, None)
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO payment_gateway_sessions (provider, access_token_encrypted, token_issued_at, token_expires_at, last_login_at, last_login_status, last_login_error) "
            "VALUES ($1, $2, $3, $4, now(), $5, $6) "
            "ON CONFLICT (provider) DO UPDATE SET access_token_encrypted = $2, token_issued_at = $3, token_expires_at = $4, last_login_at = now(), last_login_status = $5, last_login_error = $6",
            PROVIDER, encrypted, issued_at, expires_at, status, error,
        )


async def get_session() -> Optional[Dict[str, Any]]:
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM payment_gateway_sessions WHERE provider = $1", PROVIDER)
    return dict(row) if row else None


async def get_valid_token(force_login: bool = False) -> Tuple[Dict[str, Any], str]:
    """Renvoie (config, token Bearer valide), en réutilisant la session stockée
    si elle expire dans plus de TOKEN_REFRESH_MARGIN_S, sinon re-login."""
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        config = await conn.fetchrow("SELECT * FROM payment_gateway_configs WHERE provider = $1", PROVIDER)
    if config is None or not config["is_active"]:
        raise HTTPException(status_code=503, detail="PAYMENT_PROVIDER_NOT_CONFIGURED: le paiement n'est pas activé sur ce serveur.")
    config = dict(config)

    if not force_login:
        session = await get_session()
        if (
            session
            and session["last_login_status"] == "CONNECTED"
            and session["access_token_encrypted"]
            and session["token_expires_at"]
            and (session["token_expires_at"] - datetime.now(timezone.utc)).total_seconds() > TOKEN_REFRESH_MARGIN_S
        ):
            try:
                return config, decrypt_secret(session["access_token_encrypted"])
            except HTTPException:
                pass  # secret de chiffrement changé : on retente un login complet

    if not config["base_url"] or not config["username"] or not config["password_encrypted"]:
        raise HTTPException(status_code=503, detail="PAYMENT_PROVIDER_NOT_CONFIGURED: base_url, username ou mot de passe manquant (admin → Réglages).")
    password = decrypt_secret(config["password_encrypted"])
    try:
        token = await payme_login(config["base_url"], config["username"], password)
    except HTTPException as e:
        await _store_session("ERROR", error=str(e.detail))
        raise
    await _store_session("CONNECTED", token=token)
    return config, token
