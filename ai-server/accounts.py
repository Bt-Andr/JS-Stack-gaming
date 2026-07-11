"""Comptes joueurs : inscription/connexion (bcrypt + JWT), profil synchronisé
par compte, pass d'accès et quota IA journalier.

Remplace le sync nom+PIN (conservé dans main.py pour les anciens clients).
"""

import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

import core

logger = logging.getLogger("fsq-ai-server")

router = APIRouter()

JWT_SECRET = os.getenv("AUTH_JWT_SECRET", "").strip()
JWT_TTL_DAYS = 30
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LEN = 6


def auth_configured() -> bool:
    return bool(JWT_SECRET) and core.db_available()


def _require_auth_configured() -> None:
    if not JWT_SECRET:
        raise HTTPException(status_code=503, detail="AUTH_JWT_SECRET n'est pas configurée sur ce serveur.")
    core.require_db()


def make_token(user_id: uuid.UUID, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_TTL_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def optional_user(authorization: Optional[str]) -> Optional[Dict[str, Any]]:
    """Décode un header Authorization: Bearer <JWT>. None si absent ; 401 si invalide
    (une session expirée doit être signalée, pas silencieusement rétrogradée)."""
    if not auth_configured() or not authorization:
        return None
    if not authorization.lower().startswith("bearer "):
        return None
    token = authorization[7:].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Session invalide ou expirée — reconnecte-toi.")
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, email, display_name, role, created_at FROM users WHERE id = $1", user_id)
    if row is None:
        raise HTTPException(status_code=401, detail="Compte introuvable — reconnecte-toi.")
    return dict(row)


async def required_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    _require_auth_configured()
    user = await optional_user(authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="Connexion requise.")
    return user


# --- Pass d'accès & quota IA -------------------------------------------------

async def active_pass_expiry(user_id: uuid.UUID) -> Optional[datetime]:
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        exp = await conn.fetchval("SELECT max(expires_at) FROM passes WHERE user_id = $1", user_id)
    if exp and exp > datetime.now(timezone.utc):
        return exp
    return None


async def active_tier(user_id: uuid.UUID) -> Optional[str]:
    """Palier effectif = le plus élevé parmi les pass actifs. None = Découverte."""
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT DISTINCT tier FROM passes WHERE user_id = $1 AND expires_at > now()", user_id
        )
    tiers = {r["tier"] for r in rows}
    if "mentorat" in tiers:
        return "mentorat"
    if tiers:  # un pass actif quel qu'il soit → au moins Intégral
        return "integral"
    return None


async def consume_hint(user_id: uuid.UUID, daily_limit: int) -> Optional[int]:
    """Incrémente le compteur d'indices du jour si le quota le permet.
    Renvoie le nouveau compteur, ou None si le quota est atteint."""
    if daily_limit <= 0:
        return None
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO ai_usage (user_id, day, hints) VALUES ($1, CURRENT_DATE, 1) "
            "ON CONFLICT (user_id, day) DO UPDATE SET hints = ai_usage.hints + 1 "
            "WHERE ai_usage.hints < $2 RETURNING hints",
            user_id, daily_limit,
        )
    return row["hints"] if row else None


async def record_tokens(user_id: uuid.UUID, tokens_in: int, tokens_out: int) -> None:
    """Consommation réelle amont (facturable) — best-effort, pour le suivi de marge."""
    if not tokens_in and not tokens_out:
        return
    try:
        pool = await core.get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE ai_usage SET tokens_in = tokens_in + $2, tokens_out = tokens_out + $3 "
                "WHERE user_id = $1 AND day = CURRENT_DATE",
                user_id, tokens_in, tokens_out,
            )
    except Exception:
        logger.exception("record_tokens")


async def access_info(user_id: uuid.UUID) -> Dict[str, Any]:
    settings = await core.get_settings()
    exp = await active_pass_expiry(user_id)
    tier = await active_tier(user_id)
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        used = await conn.fetchval("SELECT hints FROM ai_usage WHERE user_id = $1 AND day = CURRENT_DATE", user_id)
        daily_done = await conn.fetchval(
            "SELECT true FROM daily_results WHERE user_id = $1 AND day = (now() at time zone 'utc')::date", user_id
        )
        streak_rows = await conn.fetch(
            "SELECT day FROM daily_results WHERE user_id = $1 ORDER BY day DESC LIMIT 400", user_id
        )
    return {
        # hasPass = accès complet (Intégral ou Mentorat) ; tier précise le palier.
        "hasPass": exp is not None,
        "tier": tier or "decouverte",
        "passExpiresAt": exp.isoformat() if exp else None,
        "aiDailyLimit": int(settings["aiDailyHints"]),
        "aiUsedToday": int(used or 0),
        "passPriceXaf": int(settings["passPriceXaf"]),
        "passDays": int(settings["passDays"]),
        # Palier Mentorat (premium) : tarif + plafond de génération, réglables au dashboard.
        "premiumPriceXaf": int(settings["premiumPriceXaf"]),
        "premiumPassDays": int(settings["premiumPassDays"]),
        "premiumGenDailyCap": int(settings["premiumGenDailyCap"]),
        # Le client force le défi tant que ce n'est pas fait (gate anti-fuite) ;
        # renvoyé ici, il tient donc à la connexion et sur tous les appareils.
        "dailyDoneToday": bool(daily_done),
        # Régularité : jours de Défi consécutifs jusqu'à aujourd'hui (ou hier si
        # pas encore fait aujourd'hui — la série n'est brisée qu'après un jour manqué).
        "dailyStreak": _compute_streak([r["day"] for r in streak_rows]),
    }


def _compute_streak(days_desc) -> int:
    """days_desc : dates UTC des défis faits, décroissantes, une par jour."""
    if not days_desc:
        return 0
    today = datetime.now(timezone.utc).date()
    anchor = None
    if days_desc[0] == today:
        anchor = today
    elif days_desc[0] == today - timedelta(days=1):
        anchor = today - timedelta(days=1)
    if anchor is None:
        return 0  # dernier défi trop ancien : série brisée
    streak = 0
    expect = anchor
    for d in days_desc:
        if d == expect:
            streak += 1
            expect = expect - timedelta(days=1)
        elif d < expect:
            break
    return streak


def _public_user(row: Dict[str, Any]) -> Dict[str, Any]:
    return {"id": str(row["id"]), "email": row["email"], "displayName": row["display_name"]}


async def _auth_response(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "token": make_token(row["id"], row["email"]),
        "user": _public_user(row),
        "access": await access_info(row["id"]),
    }


# --- Endpoints ---------------------------------------------------------------

class RegisterIn(BaseModel):
    email: str
    password: str
    displayName: str


class LoginIn(BaseModel):
    email: str
    password: str


@router.post("/api/v1/auth/register", status_code=201)
async def register(body: RegisterIn):
    _require_auth_configured()
    email = body.email.strip().lower()
    display_name = body.displayName.strip()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Adresse email invalide.")
    if len(body.password) < MIN_PASSWORD_LEN:
        raise HTTPException(status_code=400, detail=f"Mot de passe trop court (minimum {MIN_PASSWORD_LEN} caractères).")
    if not display_name or len(display_name) > 40:
        raise HTTPException(status_code=400, detail="Choisis un nom d'affichage (40 caractères max).")
    password_hash = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                "INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) "
                "RETURNING id, email, display_name, role, created_at",
                email, display_name, password_hash,
            )
        except core.asyncpg.UniqueViolationError:
            raise HTTPException(status_code=409, detail="Un compte existe déjà avec cet email — connecte-toi.")
    return await _auth_response(dict(row))


@router.post("/api/v1/auth/login")
async def login(body: LoginIn):
    _require_auth_configured()
    email = body.email.strip().lower()
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, display_name, role, password_hash, created_at FROM users WHERE email = $1", email
        )
    if row is None or not bcrypt.checkpw(body.password.encode("utf-8"), row["password_hash"].encode("ascii")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    return await _auth_response(dict(row))


@router.get("/api/v1/auth/me")
async def me(user: Dict[str, Any] = Depends(required_user)):
    return {"user": _public_user(user), "access": await access_info(user["id"])}


# --- Profil par compte (remplace le sync nom+PIN) ----------------------------

class ProfileIn(BaseModel):
    profile: Dict[str, Any]


@router.get("/api/v1/me/profile")
async def get_my_profile(user: Dict[str, Any] = Depends(required_user)):
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT profile, updated_at FROM user_profiles WHERE user_id = $1", user["id"])
    if row is None:
        return {"profile": None, "updatedISO": None}
    profile = row["profile"]
    if isinstance(profile, str):
        import json as _json
        profile = _json.loads(profile)
    return {"profile": profile, "updatedISO": row["updated_at"].isoformat()}


@router.put("/api/v1/me/profile")
async def put_my_profile(body: ProfileIn, user: Dict[str, Any] = Depends(required_user)):
    import json as _json
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO user_profiles (user_id, profile, updated_at) VALUES ($1, $2, now()) "
            "ON CONFLICT (user_id) DO UPDATE SET profile = $2, updated_at = now() RETURNING updated_at",
            user["id"], _json.dumps(body.profile),
        )
    return {"ok": True, "updatedISO": row["updated_at"].isoformat()}
