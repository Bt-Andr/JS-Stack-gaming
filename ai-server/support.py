"""Tickets de support joueur : plaintes de paiement, bugs, questions de compte.

Un système d'abonnement a besoin d'un canal de recours — sans ça, un joueur
qui a payé sans être débloqué n'a aucun moyen de le signaler. Chaque ticket
peut être lié à un paiement (payment_id) pour que l'admin retrouve tout de
suite l'historique complet (voir /api/v1/admin/payments/{id}).
"""

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

import accounts
import core

router = APIRouter()

VALID_CATEGORIES = {"paiement", "compte", "bug", "autre"}
VALID_STATUSES = {"open", "in_progress", "resolved", "closed"}


class TicketIn(BaseModel):
    category: str = "autre"
    message: str
    paymentId: Optional[str] = None


@router.post("/api/v1/support/tickets", status_code=201)
async def create_ticket(body: TicketIn, user: Dict[str, Any] = Depends(accounts.required_user)):
    core.require_db()
    category = body.category if body.category in VALID_CATEGORIES else "autre"
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Le message ne peut pas être vide.")
    if len(message) > 4000:
        raise HTTPException(status_code=400, detail="Message trop long (4000 caractères max).")
    payment_id = None
    if body.paymentId:
        try:
            payment_id = uuid.UUID(body.paymentId)
        except ValueError:
            raise HTTPException(status_code=400, detail="paymentId invalide.")
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        if payment_id is not None:
            owns = await conn.fetchval("SELECT 1 FROM payments WHERE id=$1 AND user_id=$2", payment_id, user["id"])
            if not owns:
                raise HTTPException(status_code=404, detail="Paiement introuvable.")
        row = await conn.fetchrow(
            "INSERT INTO support_tickets (user_id, payment_id, category, message) VALUES ($1, $2, $3, $4) RETURNING *",
            user["id"], payment_id, category, message,
        )
    return _public_ticket(row)


@router.get("/api/v1/support/tickets")
async def list_my_tickets(user: Dict[str, Any] = Depends(accounts.required_user)):
    core.require_db()
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM support_tickets WHERE user_id=$1 ORDER BY created_at DESC", user["id"])
    return {"tickets": [_public_ticket(r) for r in rows]}


def _public_ticket(r: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(r["id"]),
        "category": r["category"],
        "message": r["message"],
        "status": r["status"],
        "adminNote": r["admin_note"],
        "paymentId": str(r["payment_id"]) if r["payment_id"] else None,
        "createdAt": r["created_at"].isoformat(),
        "updatedAt": r["updated_at"].isoformat(),
    }


# --- Admin -------------------------------------------------------------------

@router.get("/api/v1/admin/support/tickets")
async def admin_list_tickets(status: Optional[str] = None, limit: int = 100,
                              x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    core.require_db()
    limit = max(1, min(limit, 300))
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        if status:
            rows = await conn.fetch(
                "SELECT t.*, u.email, u.display_name FROM support_tickets t JOIN users u ON u.id = t.user_id "
                "WHERE t.status=$1 ORDER BY t.created_at DESC LIMIT $2", status, limit,
            )
        else:
            rows = await conn.fetch(
                "SELECT t.*, u.email, u.display_name FROM support_tickets t JOIN users u ON u.id = t.user_id "
                "ORDER BY (t.status = 'open') DESC, t.created_at DESC LIMIT $1", limit,
            )
    out = []
    for r in rows:
        t = _public_ticket(r)
        t["email"] = r["email"]
        t["displayName"] = r["display_name"]
        out.append(t)
    return {"tickets": out}


class TicketPatch(BaseModel):
    status: Optional[str] = None
    adminNote: Optional[str] = None


@router.patch("/api/v1/admin/support/tickets/{ticket_id}")
async def admin_update_ticket(ticket_id: str, body: TicketPatch, x_admin_key: Optional[str] = Header(default=None)):
    core.require_admin(x_admin_key)
    core.require_db()
    try:
        tid = uuid.UUID(ticket_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Ticket introuvable.")
    if body.status is not None and body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status doit être l'un de {sorted(VALID_STATUSES)}.")
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        if body.status is not None:
            await conn.execute("UPDATE support_tickets SET status=$2, updated_at=now() WHERE id=$1", tid, body.status)
        if body.adminNote is not None:
            await conn.execute("UPDATE support_tickets SET admin_note=$2, updated_at=now() WHERE id=$1", tid, body.adminNote.strip()[:4000])
        row = await conn.fetchrow(
            "SELECT t.*, u.email, u.display_name FROM support_tickets t JOIN users u ON u.id = t.user_id WHERE t.id=$1", tid,
        )
    if row is None:
        raise HTTPException(status_code=404, detail="Ticket introuvable.")
    out = _public_ticket(row)
    out["email"] = row["email"]
    out["displayName"] = row["display_name"]
    return out
