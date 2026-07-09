"""Socle partagé : pool Postgres, schéma, réglages à chaud, garde admin.

Toutes les tables vivent dans le même Neon que la banque de questions — le
schéma est créé/complété automatiquement à la première connexion (IF NOT
EXISTS), comme pour la banque.
"""

import json
import os
from typing import Any, Dict, Optional

from fastapi import HTTPException

try:
    import asyncpg
except ImportError:  # déploiement IA-only sans base
    asyncpg = None

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "").strip()

# Modules jouables sans pass : la démo-accroche. Tout le reste exige un accès actif.
FOUNDATION_MODULES = {"js-fond", "js-avance", "async"}

SCHEMA = """
CREATE TABLE IF NOT EXISTS questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     text NOT NULL,
  qtype         text NOT NULL,
  payload       jsonb NOT NULL,
  technical     boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'active',
  content_hash  text UNIQUE NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_questions_module_status ON questions (module_id, status);

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  display_name  text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'player',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile    jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS passes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at  timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  source     text NOT NULL DEFAULT 'payme',
  payment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_passes_user ON passes (user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day        date NOT NULL,
  hints      int NOT NULL DEFAULT 0,
  tokens_in  bigint NOT NULL DEFAULT 0,
  tokens_out bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind           text NOT NULL DEFAULT 'pass30',
  amount         numeric(12,2) NOT NULL,
  currency       text NOT NULL DEFAULT 'XAF',
  status         text NOT NULL DEFAULT 'PENDING',
  provider       text NOT NULL DEFAULT 'PAYME',
  provider_ref   text,
  local_ref      uuid UNIQUE NOT NULL,
  customer_phone text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  finalized_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  provider           text PRIMARY KEY,
  base_url           text NOT NULL DEFAULT '',
  username           text NOT NULL DEFAULT '',
  password_encrypted text NOT NULL DEFAULT '',
  client_fees_rate   int NOT NULL DEFAULT 100,
  is_active          boolean NOT NULL DEFAULT false,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_gateway_sessions (
  provider               text PRIMARY KEY REFERENCES payment_gateway_configs(provider) ON DELETE CASCADE,
  access_token_encrypted text,
  token_issued_at        timestamptz,
  token_expires_at       timestamptz,
  last_login_at          timestamptz,
  last_login_status      text NOT NULL DEFAULT 'DISCONNECTED',
  last_login_error       text
);

CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider                text NOT NULL DEFAULT 'PAYME',
  payment_id              uuid REFERENCES payments(id) ON DELETE SET NULL,
  local_reference         uuid UNIQUE NOT NULL,
  gateway_reference       text UNIQUE,
  customer_phone          text,
  amount                  numeric(12,2) NOT NULL,
  currency                text NOT NULL DEFAULT 'XAF',
  client_fees_rate        int,
  provider_status         text,
  status                  text NOT NULL DEFAULT 'INITIATION_PENDING',
  initiation_requested_at timestamptz NOT NULL DEFAULT now(),
  initiation_succeeded_at timestamptz,
  last_polled_at          timestamptz,
  finalized_at            timestamptz,
  failure_reason          text,
  raw_initiate_response   jsonb,
  raw_status_response     jsonb
);
CREATE INDEX IF NOT EXISTS idx_pgt_status ON payment_gateway_transactions (status);

CREATE TABLE IF NOT EXISTS payment_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  status     text NOT NULL,
  detail     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON payment_events (payment_id, created_at);

CREATE TABLE IF NOT EXISTS support_tickets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id   uuid REFERENCES payments(id) ON DELETE SET NULL,
  category     text NOT NULL DEFAULT 'autre',
  message      text NOT NULL,
  status       text NOT NULL DEFAULT 'open',
  admin_note   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets (user_id, created_at DESC);
"""

# Réglages produits, modifiables à chaud via l'admin (app_settings), sans redéploiement.
SETTINGS_DEFAULTS: Dict[str, Any] = {
    "passPriceXaf": 1500,
    "passDays": 30,
    "aiDailyHints": 20,
}

_pool = None


def _clean_dsn(dsn: str) -> str:
    # asyncpg rejette le paramètre channel_binding des DSN Neon — on reconstruit
    # la query string sans lui (une regex simple casse s'il n'est pas dernier).
    from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
    parts = urlsplit(dsn)
    query = urlencode([(k, v) for k, v in parse_qsl(parts.query) if k != "channel_binding"])
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))


def db_available() -> bool:
    return bool(DATABASE_URL and asyncpg is not None)


def require_db() -> None:
    if not db_available():
        raise HTTPException(status_code=503, detail="La base de données n'est pas configurée sur ce serveur (DATABASE_URL manquante ou asyncpg absent).")


def require_admin(x_admin_key: Optional[str]) -> None:
    if not ADMIN_API_KEY:
        raise HTTPException(status_code=503, detail="ADMIN_API_KEY n'est pas configurée sur ce serveur.")
    if not x_admin_key or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Clé admin invalide ou manquante.")


async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(_clean_dsn(DATABASE_URL), min_size=1, max_size=5)
        async with _pool.acquire() as conn:
            await conn.execute(SCHEMA)
    return _pool


async def get_settings() -> Dict[str, Any]:
    settings = dict(SETTINGS_DEFAULTS)
    if not db_available():
        return settings
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT key, value FROM app_settings")
    for row in rows:
        value = row["value"]
        settings[row["key"]] = json.loads(value) if isinstance(value, str) else value
    return settings


async def update_settings(patch: Dict[str, Any]) -> Dict[str, Any]:
    require_db()
    pool = await get_pool()
    async with pool.acquire() as conn:
        for key, value in patch.items():
            await conn.execute(
                "INSERT INTO app_settings (key, value) VALUES ($1, $2) "
                "ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()",
                key, json.dumps(value),
            )
    return await get_settings()
