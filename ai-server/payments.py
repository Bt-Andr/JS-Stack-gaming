"""Flux de paiement du pass d'accès : checkout PayMe → polling → pass 30 jours.

Trois chemins de finalisation, comme dans l'intégration K-Beauty d'origine :
le polling du client (GET /pay/{id}), le cron de réconciliation (60 s), et
l'expiration des paiements en attente. Aucune confiance dans le front : seul
le statut re-vérifié auprès de PayMe crée un pass.

Mode bac à sable : PAYGATE_SANDBOX=1 court-circuite PayMe (succès automatique
après quelques secondes) pour développer et tester le flux complet.
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

import accounts
import core
import payme

logger = logging.getLogger("fsq-ai-server")

router = APIRouter()

SANDBOX = os.getenv("PAYGATE_SANDBOX", "").strip() == "1"
SANDBOX_DELAY_S = 8          # délai avant le succès automatique en bac à sable
PAYMENT_TTL_MIN = 30         # au-delà, un paiement PENDING passe EXPIRED
POLL_THROTTLE_S = 3          # ne re-poll PayMe que si le dernier poll date d'au moins ça
RECONCILE_INTERVAL_S = 60


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _log_event(conn, payment_id: uuid.UUID, status: str, detail: Optional[str] = None) -> None:
    """Trace horodatée des transitions d'un paiement — consultée depuis l'admin
    en cas de plainte ('j'ai payé mais rien ne s'est débloqué')."""
    await conn.execute(
        "INSERT INTO payment_events (payment_id, status, detail) VALUES ($1, $2, $3)",
        payment_id, status, (detail or "")[:500] or None,
    )


# --- Checkout -----------------------------------------------------------------

class CheckoutIn(BaseModel):
    phone: str
    tier: Optional[str] = None  # 'integral' (défaut) ou 'mentorat'


@router.post("/api/v1/pay/checkout")
async def checkout(body: CheckoutIn, user: Dict[str, Any] = Depends(accounts.required_user)):
    core.require_db()
    settings = await core.get_settings()
    tier = (body.tier or "integral").strip().lower()
    if tier not in ("integral", "mentorat"):
        raise HTTPException(status_code=400, detail="Palier invalide (integral ou mentorat).")
    # Le palier fixe le montant ET le 'kind' du paiement, relu à la validation
    # pour créditer un pass du bon palier.
    if tier == "mentorat":
        amount, kind = int(settings["premiumPriceXaf"]), "mentorat30"
    else:
        amount, kind = int(settings["passPriceXaf"]), "pass30"
    phone = payme.normalize_cm_phone(body.phone)
    local_ref = uuid.uuid4()

    pool = await core.get_pool()
    async with pool.acquire() as conn:
        payment = await conn.fetchrow(
            "INSERT INTO payments (user_id, kind, amount, currency, status, provider, local_ref, customer_phone) "
            "VALUES ($1, $2, $3, 'XAF', 'PENDING', 'PAYME', $4, $5) RETURNING *",
            user["id"], kind, amount, local_ref, phone,
        )
        # La ligne d'audit est créée AVANT l'appel provider (INITIATION_PENDING),
        # puis mise à jour avec sa réponse — on garde une trace même si l'appel plante.
        await conn.execute(
            "INSERT INTO payment_gateway_transactions (provider, payment_id, local_reference, customer_phone, amount, client_fees_rate) "
            "VALUES ('PAYME', $1, $2, $3, $4, 100)",
            payment["id"], local_ref, phone, amount,
        )
        await _log_event(conn, payment["id"], "PENDING", f"Checkout initié par le joueur ({phone}).")

    if SANDBOX:
        gateway_ref = f"SANDBOX-{local_ref}"
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE payment_gateway_transactions SET gateway_reference=$2, provider_status='PAYMENT_IN_PROGRESS', "
                "status='PROCESSING', initiation_succeeded_at=now() WHERE local_reference=$1",
                local_ref, gateway_ref,
            )
            await conn.execute("UPDATE payments SET provider_ref=$2 WHERE id=$1", payment["id"], gateway_ref)
            await _log_event(conn, payment["id"], "PROCESSING", "Bac à sable : succès automatique programmé.")
        return {"paymentId": str(payment["id"]), "status": "PROCESSING", "amount": amount, "currency": "XAF", "sandbox": True}

    config, token = await payme.get_valid_token()
    try:
        data = await payme.payme_init_payment(config["base_url"], token, amount, phone, str(local_ref), int(config["client_fees_rate"]))
    except HTTPException as e:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE payment_gateway_transactions SET status='FAILED', failure_reason=$2, finalized_at=now() WHERE local_reference=$1",
                local_ref, str(e.detail)[:500],
            )
            await conn.execute("UPDATE payments SET status='FAILED', finalized_at=now() WHERE id=$1", payment["id"])
            await _log_event(conn, payment["id"], "FAILED", f"Échec à l'initiation: {e.detail}")
        raise

    gateway_ref = str(data["gateway_reference"])
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE payment_gateway_transactions SET gateway_reference=$2, provider_status=$3, status=$4, "
            "initiation_succeeded_at=now(), raw_initiate_response=$5 WHERE local_reference=$1",
            local_ref, gateway_ref, str(data.get("status")), payme.map_status(data.get("status")), json.dumps(data),
        )
        await conn.execute("UPDATE payments SET provider_ref=$2 WHERE id=$1", payment["id"], gateway_ref)
        await _log_event(conn, payment["id"], "PROCESSING", f"Push envoyé chez PayMe (ref {gateway_ref}).")
    return {"paymentId": str(payment["id"]), "status": "PROCESSING", "amount": amount, "currency": "XAF"}


# --- Historique du joueur (doit être déclaré avant /pay/{payment_id} : sinon
# "history" serait capturé comme un payment_id par la route dynamique) -----------

@router.get("/api/v1/pay/history")
async def payment_history(user: Dict[str, Any] = Depends(accounts.required_user)):
    core.require_db()
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM payments WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30", user["id"],
        )
    return {"payments": [
        {
            "id": str(r["id"]), "amount": int(r["amount"]), "currency": r["currency"], "status": r["status"],
            "phone": r["customer_phone"], "createdAt": r["created_at"].isoformat(),
            "finalizedAt": r["finalized_at"].isoformat() if r["finalized_at"] else None,
        }
        for r in rows
    ]}


# --- Statut (cible du polling front) -------------------------------------------

@router.get("/api/v1/pay/{payment_id}")
async def payment_status(payment_id: str, user: Dict[str, Any] = Depends(accounts.required_user)):
    core.require_db()
    try:
        pid = uuid.UUID(payment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Paiement introuvable.")
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        payment = await conn.fetchrow("SELECT * FROM payments WHERE id=$1 AND user_id=$2", pid, user["id"])
    if payment is None:
        raise HTTPException(status_code=404, detail="Paiement introuvable.")

    if payment["status"] == "PENDING":
        async with pool.acquire() as conn:
            tx = await conn.fetchrow("SELECT * FROM payment_gateway_transactions WHERE payment_id=$1", pid)
        if tx and tx["status"] not in payme.TERMINAL_STATUSES and tx["gateway_reference"]:
            try:
                await _poll_and_apply(dict(tx))
            except HTTPException as e:
                logger.warning("Poll PayMe indisponible pour %s: %s", pid, e.detail)
        async with pool.acquire() as conn:
            payment = await conn.fetchrow("SELECT * FROM payments WHERE id=$1", pid)

    out = {"paymentId": str(payment["id"]), "status": payment["status"], "amount": int(payment["amount"]), "currency": payment["currency"]}
    if payment["status"] == "PAID":
        exp = await accounts.active_pass_expiry(user["id"])
        out["passExpiresAt"] = exp.isoformat() if exp else None
    return out


# --- Application du résultat -----------------------------------------------------

async def _poll_and_apply(tx: Dict[str, Any]) -> None:
    """Re-vérifie le statut provider d'une transaction en cours et applique le
    résultat métier s'il est terminal."""
    now = _now()
    gateway_ref = tx["gateway_reference"]

    if SANDBOX and str(gateway_ref).startswith("SANDBOX-"):
        if (now - tx["initiation_requested_at"]).total_seconds() < SANDBOX_DELAY_S:
            return
        provider_status, raw = "SUCCESS", {"status": "SUCCESS", "sandbox": True}
    else:
        if tx["last_polled_at"] and (now - tx["last_polled_at"]).total_seconds() < POLL_THROTTLE_S:
            return
        config, token = await payme.get_valid_token()
        provider_status, raw = await payme.payme_payment_status(config["base_url"], token, gateway_ref)

    internal = payme.map_status(provider_status)
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE payment_gateway_transactions SET provider_status=$2, status=$3, last_polled_at=now(), "
            "raw_status_response=$4, finalized_at=CASE WHEN $5 THEN now() ELSE finalized_at END WHERE id=$1",
            tx["id"], provider_status, internal, json.dumps(raw), internal in payme.TERMINAL_STATUSES,
        )
    if internal in payme.TERMINAL_STATUSES and tx["payment_id"]:
        await _apply_outcome(tx["payment_id"], internal)


async def _apply_outcome(payment_id: uuid.UUID, outcome: str) -> None:
    """Idempotent : verrouille le paiement (FOR UPDATE) pour que polling client et
    réconciliation ne créditent jamais deux fois le même pass."""
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            payment = await conn.fetchrow("SELECT * FROM payments WHERE id=$1 FOR UPDATE", payment_id)
            if payment is None or payment["status"] != "PENDING":
                return
            if outcome == "SUCCEEDED":
                settings = await core.get_settings()
                is_mentorat = payment["kind"] == "mentorat30"
                tier = "mentorat" if is_mentorat else "integral"
                days = int(settings["premiumPassDays"]) if is_mentorat else int(settings["passDays"])
                # Cumul par palier : un pass Mentorat ne « mange » pas le temps Intégral.
                current = await conn.fetchval(
                    "SELECT max(expires_at) FROM passes WHERE user_id=$1 AND tier=$2", payment["user_id"], tier
                )
                base = current if current and current > _now() else _now()
                expires = base + timedelta(days=days)
                await conn.execute(
                    "INSERT INTO passes (user_id, starts_at, expires_at, source, payment_id, tier) VALUES ($1, now(), $2, 'payme', $3, $4)",
                    payment["user_id"], expires, payment_id, tier,
                )
                await conn.execute("UPDATE payments SET status='PAID', finalized_at=now() WHERE id=$1", payment_id)
                await _log_event(conn, payment_id, "PAID", f"Pass {tier} crédité jusqu'au {expires.isoformat()}.")
                logger.info("Pass %s crédité jusqu'au %s (paiement %s)", tier, expires.isoformat(), payment_id)
            else:
                status = "EXPIRED" if outcome == "EXPIRED" else "FAILED"
                await conn.execute("UPDATE payments SET status=$2, finalized_at=now() WHERE id=$1", payment_id, status)
                await _log_event(conn, payment_id, status, f"Résultat provider: {outcome}.")


# --- Réconciliation (filet de sécurité, pas de webhook fiable) --------------------

async def reconcile_once() -> None:
    if not core.db_available():
        return
    pool = await core.get_pool()

    # 1. Expire les paiements en attente depuis trop longtemps.
    async with pool.acquire() as conn:
        stale = await conn.fetch(
            "SELECT id FROM payments WHERE status='PENDING' AND created_at < now() - make_interval(mins => $1)",
            PAYMENT_TTL_MIN,
        )
    for row in stale:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE payment_gateway_transactions SET status='EXPIRED', finalized_at=now() "
                "WHERE payment_id=$1 AND status NOT IN ('SUCCEEDED','FAILED','EXPIRED','CANCELLED')",
                row["id"],
            )
        await _apply_outcome(row["id"], "EXPIRED")

    # 2. Re-poll les transactions encore en cours.
    async with pool.acquire() as conn:
        pending = await conn.fetch(
            "SELECT * FROM payment_gateway_transactions "
            "WHERE status IN ('INITIATION_PENDING','PROCESSING','UNKNOWN') AND gateway_reference IS NOT NULL"
        )
    for tx in pending:
        try:
            await _poll_and_apply(dict(tx))
        except HTTPException as e:
            logger.warning("Réconciliation: provider indisponible (%s): %s", tx["gateway_reference"], e.detail)
        except Exception:
            logger.exception("Réconciliation: erreur sur %s", tx["gateway_reference"])


async def reconcile_loop() -> None:
    await asyncio.sleep(5)
    while True:
        try:
            await reconcile_once()
        except Exception:
            logger.exception("Boucle de réconciliation")
        await asyncio.sleep(RECONCILE_INTERVAL_S)


# --- Admin : config PayMe, tarifs, suivi ------------------------------------------

class PaygatePatch(BaseModel):
    baseUrl: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    clientFeesRate: Optional[int] = None
    isActive: Optional[bool] = None


def _masked_config(config: Optional[Dict[str, Any]], session: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "provider": payme.PROVIDER,
        "baseUrl": (config or {}).get("base_url", ""),
        "username": (config or {}).get("username", ""),
        "hasPassword": bool((config or {}).get("password_encrypted", "")),
        "clientFeesRate": (config or {}).get("client_fees_rate", 100),
        "isActive": (config or {}).get("is_active", False),
        "sandbox": SANDBOX,
        "session": {
            "status": (session or {}).get("last_login_status", "DISCONNECTED"),
            "tokenExpiresAt": session["token_expires_at"].isoformat() if session and session.get("token_expires_at") else None,
            "lastLoginAt": session["last_login_at"].isoformat() if session and session.get("last_login_at") else None,
            "lastLoginError": (session or {}).get("last_login_error"),
        },
    }


async def _load_config_row() -> Optional[Dict[str, Any]]:
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM payment_gateway_configs WHERE provider=$1", payme.PROVIDER)
    return dict(row) if row else None


@router.get("/api/v1/admin/paygate")
async def admin_get_paygate(x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    core.require_db()
    return _masked_config(await _load_config_row(), await payme.get_session())


@router.patch("/api/v1/admin/paygate")
async def admin_patch_paygate(body: PaygatePatch, x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    core.require_db()
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO payment_gateway_configs (provider) VALUES ($1) ON CONFLICT (provider) DO NOTHING",
            payme.PROVIDER,
        )
        if body.baseUrl is not None:
            await conn.execute("UPDATE payment_gateway_configs SET base_url=$2, updated_at=now() WHERE provider=$1", payme.PROVIDER, body.baseUrl.strip().rstrip("/"))
        if body.username is not None:
            await conn.execute("UPDATE payment_gateway_configs SET username=$2, updated_at=now() WHERE provider=$1", payme.PROVIDER, body.username.strip())
        if body.password:
            await conn.execute("UPDATE payment_gateway_configs SET password_encrypted=$2, updated_at=now() WHERE provider=$1", payme.PROVIDER, payme.encrypt_secret(body.password))
        if body.clientFeesRate is not None:
            if not (0 <= body.clientFeesRate <= 100):
                raise HTTPException(status_code=400, detail="clientFeesRate doit être entre 0 et 100.")
            await conn.execute("UPDATE payment_gateway_configs SET client_fees_rate=$2, updated_at=now() WHERE provider=$1", payme.PROVIDER, body.clientFeesRate)
        if body.isActive is not None:
            await conn.execute("UPDATE payment_gateway_configs SET is_active=$2, updated_at=now() WHERE provider=$1", payme.PROVIDER, body.isActive)
    return _masked_config(await _load_config_row(), await payme.get_session())


@router.post("/api/v1/admin/paygate/connect")
async def admin_paygate_connect(x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    core.require_db()
    await payme.get_valid_token(force_login=True)
    return _masked_config(await _load_config_row(), await payme.get_session())


@router.get("/api/v1/admin/paygate/transactions")
async def admin_paygate_transactions(status: Optional[str] = None, limit: int = 50,
                                     x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    core.require_db()
    limit = max(1, min(limit, 200))
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        if status:
            rows = await conn.fetch(
                "SELECT t.*, u.email FROM payment_gateway_transactions t "
                "LEFT JOIN payments p ON p.id = t.payment_id LEFT JOIN users u ON u.id = p.user_id "
                "WHERE t.status = $1 ORDER BY t.initiation_requested_at DESC LIMIT $2", status, limit)
        else:
            rows = await conn.fetch(
                "SELECT t.*, u.email FROM payment_gateway_transactions t "
                "LEFT JOIN payments p ON p.id = t.payment_id LEFT JOIN users u ON u.id = p.user_id "
                "ORDER BY t.initiation_requested_at DESC LIMIT $1", limit)
    out = []
    for r in rows:
        out.append({
            "id": str(r["id"]),
            "email": r["email"],
            "amount": int(r["amount"]),
            "phone": r["customer_phone"],
            "status": r["status"],
            "providerStatus": r["provider_status"],
            "gatewayReference": r["gateway_reference"],
            "requestedAt": r["initiation_requested_at"].isoformat(),
            "finalizedAt": r["finalized_at"].isoformat() if r["finalized_at"] else None,
            "failureReason": r["failure_reason"],
        })
    return {"transactions": out}


# --- Admin : traçabilité des paiements (en cas de plainte) -----------------------

@router.get("/api/v1/admin/payments")
async def admin_list_payments(email: Optional[str] = None, status: Optional[str] = None, limit: int = 50,
                               x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    core.require_db()
    limit = max(1, min(limit, 200))
    conditions = []
    params: list = []
    if email:
        params.append(f"%{email.strip().lower()}%")
        conditions.append(f"u.email ILIKE ${len(params)}")
    if status:
        params.append(status)
        conditions.append(f"p.status = ${len(params)}")
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    params.append(limit)
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT p.*, u.email, u.display_name FROM payments p JOIN users u ON u.id = p.user_id "
            f"{where} ORDER BY p.created_at DESC LIMIT ${len(params)}",
            *params,
        )
    return {"payments": [
        {
            "id": str(r["id"]), "email": r["email"], "displayName": r["display_name"],
            "amount": int(r["amount"]), "currency": r["currency"], "status": r["status"],
            "phone": r["customer_phone"], "providerRef": r["provider_ref"],
            "createdAt": r["created_at"].isoformat(),
            "finalizedAt": r["finalized_at"].isoformat() if r["finalized_at"] else None,
        }
        for r in rows
    ]}


@router.get("/api/v1/admin/payments/{payment_id}")
async def admin_payment_detail(payment_id: str, x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    core.require_db()
    try:
        pid = uuid.UUID(payment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Paiement introuvable.")
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        payment = await conn.fetchrow(
            "SELECT p.*, u.email, u.display_name FROM payments p JOIN users u ON u.id = p.user_id WHERE p.id=$1", pid,
        )
        if payment is None:
            raise HTTPException(status_code=404, detail="Paiement introuvable.")
        events = await conn.fetch("SELECT * FROM payment_events WHERE payment_id=$1 ORDER BY created_at ASC", pid)
        tx = await conn.fetchrow("SELECT * FROM payment_gateway_transactions WHERE payment_id=$1", pid)
    return {
        "id": str(payment["id"]), "email": payment["email"], "displayName": payment["display_name"],
        "amount": int(payment["amount"]), "currency": payment["currency"], "status": payment["status"],
        "phone": payment["customer_phone"], "providerRef": payment["provider_ref"],
        "createdAt": payment["created_at"].isoformat(),
        "finalizedAt": payment["finalized_at"].isoformat() if payment["finalized_at"] else None,
        "events": [
            {"status": e["status"], "detail": e["detail"], "createdAt": e["created_at"].isoformat()}
            for e in events
        ],
        "gatewayTransaction": {
            "gatewayReference": tx["gateway_reference"], "providerStatus": tx["provider_status"],
            "status": tx["status"], "failureReason": tx["failure_reason"],
            "lastPolledAt": tx["last_polled_at"].isoformat() if tx["last_polled_at"] else None,
        } if tx else None,
    }


class CompPassIn(BaseModel):
    email: str
    days: Optional[int] = None
    note: Optional[str] = None
    tier: Optional[str] = None  # 'integral' (défaut) ou 'mentorat'


@router.post("/api/v1/admin/passes")
async def admin_grant_pass(body: CompPassIn, x_admin_key: Optional[str] = Header(default=None)):
    """Crédite manuellement un pass d'accès à un compte, par email. Sert au
    support (créditer un joueur dont le paiement a abouti chez PayMe mais pas en
    base, geste commercial, code promo) et aux tests de bout en bout. Le pass se
    cumule sur un pass existant, exactement comme un achat ; tracé source='admin'
    (jamais rattaché à un paiement)."""
    core.require_admin(x_admin_key)
    core.require_db()
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email requis.")
    settings = await core.get_settings()
    tier = (body.tier or "integral").strip().lower()
    if tier not in ("integral", "mentorat"):
        raise HTTPException(status_code=400, detail="Palier invalide (integral ou mentorat).")
    default_days = int(settings["premiumPassDays"]) if tier == "mentorat" else int(settings["passDays"])
    days = int(body.days) if body.days is not None else default_days
    if days < 1 or days > 3650:
        raise HTTPException(status_code=400, detail="Durée invalide (1 à 3650 jours).")
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            user = await conn.fetchrow(
                "SELECT id, email, display_name FROM users WHERE lower(email)=$1", email
            )
            if user is None:
                raise HTTPException(status_code=404, detail="Aucun compte avec cet email.")
            # On cumule sur un pass du même palier ; sinon on part de maintenant.
            current = await conn.fetchval(
                "SELECT max(expires_at) FROM passes WHERE user_id=$1 AND tier=$2", user["id"], tier
            )
            base = current if current and current > _now() else _now()
            expires = base + timedelta(days=days)
            await conn.execute(
                "INSERT INTO passes (user_id, starts_at, expires_at, source, payment_id, tier) "
                "VALUES ($1, now(), $2, 'admin', NULL, $3)",
                user["id"], expires, tier,
            )
    logger.info("Pass admin (%s) crédité à %s jusqu'au %s (note: %s)",
                tier, email, expires.isoformat(), (body.note or "")[:120])
    return {
        "email": user["email"], "displayName": user["display_name"],
        "tier": tier, "days": days, "expiresAt": expires.isoformat(),
        "stacked": bool(current and current > _now()),
    }


class SettingsPatch(BaseModel):
    passPriceXaf: Optional[int] = None
    passDays: Optional[int] = None
    aiDailyHints: Optional[int] = None
    premiumPriceXaf: Optional[int] = None
    premiumPassDays: Optional[int] = None
    premiumGenDailyCap: Optional[int] = None


@router.get("/api/v1/admin/settings")
async def admin_get_settings(x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    return await core.get_settings()


@router.patch("/api/v1/admin/settings")
async def admin_patch_settings(body: SettingsPatch, x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    patch: Dict[str, Any] = {}
    for key in ("passPriceXaf", "passDays", "aiDailyHints", "premiumPriceXaf", "premiumPassDays", "premiumGenDailyCap"):
        value = getattr(body, key)
        if value is not None:
            if value <= 0:
                raise HTTPException(status_code=400, detail=f"{key} doit être strictement positif.")
            patch[key] = int(value)
    if not patch:
        raise HTTPException(status_code=400, detail="Aucun réglage à modifier.")
    return await core.update_settings(patch)
