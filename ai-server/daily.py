"""Défi Quotidien serveur-autoritatif + classement plateforme.

Le Défi est un examen commun : même graine (dérivée de la date UTC) pour tout
le monde, une seule tentative comptée par jour. C'est la base à la fois du
gate obligatoire côté client (on refuse de rejouer un jour déjà fait, et
`access.dailyDoneToday` tient la connexion multi-appareils) et du classement
plateforme — le signal le plus juste pour distinguer les meilleurs, puisque
tout le monde affronte les mêmes questions le même jour (utile au PIP).

Le classement se lit sans compte (les recruteurs/PIP doivent pouvoir le
consulter) : on n'y expose que le nom d'affichage, jamais l'email.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

import accounts
import core

router = APIRouter()

# Borne de sécurité : un défi ne peut pas contenir plus de questions qu'il n'y
# a de modules, et le score ne peut pas dépasser le total soumis.
MAX_DAILY_QUESTIONS = 50


def _utc_today_ref() -> str:
    now = datetime.now(timezone.utc)
    return f"{now.year:04d}-{now.month:02d}-{now.day:02d}"


class DailySubmitIn(BaseModel):
    reference: str            # "YYYY-MM-DD" (UTC) — doit être le jour courant
    score: int
    total: int
    durationMs: int = 0


@router.post("/api/v1/daily/submit")
async def submit_daily(body: DailySubmitIn, user: Dict[str, Any] = Depends(accounts.required_user)):
    core.require_db()
    # Le serveur fait autorité sur la date : on refuse un référentiel qui n'est
    # pas le jour UTC courant (anti-antidatage / rejeu d'un ancien défi).
    if body.reference != _utc_today_ref():
        raise HTTPException(status_code=409, detail="Ce défi n'est plus celui d'aujourd'hui — recharge l'application.")
    total = int(body.total)
    score = int(body.score)
    if total < 0 or total > MAX_DAILY_QUESTIONS or score < 0 or score > total:
        raise HTTPException(status_code=400, detail="Résultat de défi invalide.")
    duration = max(0, int(body.durationMs))
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        # Une seule tentative comptée par jour : la première gagne (c'est un
        # examen, pas un entraînement rejouable pour améliorer son rang).
        row = await conn.fetchrow(
            "INSERT INTO daily_results (user_id, day, score, total, duration_ms) "
            "VALUES ($1, (now() at time zone 'utc')::date, $2, $3, $4) "
            "ON CONFLICT (user_id, day) DO NOTHING "
            "RETURNING score, total",
            user["id"], score, total, duration,
        )
    # Idempotent : si le jour était déjà enregistré, on renvoie ok sans écraser.
    return {"ok": True, "dailyDoneToday": True, "recorded": row is not None}


@router.get("/api/v1/daily/status")
async def daily_status(user: Dict[str, Any] = Depends(accounts.required_user)):
    core.require_db()
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        done = await conn.fetchval(
            "SELECT true FROM daily_results WHERE user_id = $1 AND day = (now() at time zone 'utc')::date",
            user["id"],
        )
    return {"reference": _utc_today_ref(), "dailyDoneToday": bool(done)}


@router.get("/api/v1/leaderboard")
async def leaderboard(
    limit: int = 100,
    authorization: Optional[str] = Header(default=None),
):
    """Classement par performance au Défi Quotidien : cumul de bonnes réponses
    (récompense la régularité), départage par précision. Public."""
    core.require_db()
    limit = max(1, min(int(limit), 200))
    pool = await core.get_pool()
    # Le rang de l'appelant est renvoyé même s'il est hors du top affiché.
    me = None
    try:
        me = await accounts.optional_user(authorization)
    except HTTPException:
        me = None  # session expirée : le classement reste consultable en invité

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            WITH agg AS (
              SELECT d.user_id,
                     sum(d.score)              AS points,
                     count(*)                  AS days,
                     sum(d.total)              AS attempted
              FROM daily_results d
              GROUP BY d.user_id
            ),
            ranked AS (
              SELECT a.*, u.display_name,
                     rank() OVER (
                       ORDER BY a.points DESC,
                                (a.points::float / NULLIF(a.attempted, 0)) DESC,
                                a.days DESC
                     ) AS rnk
              FROM agg a JOIN users u ON u.id = a.user_id
            )
            SELECT * FROM ranked ORDER BY rnk LIMIT $1
            """,
            limit,
        )
        my_rank = None
        if me is not None:
            my_rank = await conn.fetchrow(
                """
                WITH agg AS (
                  SELECT d.user_id, sum(d.score) AS points, count(*) AS days, sum(d.total) AS attempted
                  FROM daily_results d GROUP BY d.user_id
                ),
                ranked AS (
                  SELECT a.*, rank() OVER (
                    ORDER BY a.points DESC,
                             (a.points::float / NULLIF(a.attempted, 0)) DESC,
                             a.days DESC
                  ) AS rnk
                  FROM agg a
                )
                SELECT rnk, points, days, attempted FROM ranked WHERE user_id = $1
                """,
                me["id"],
            )

    def _entry(r):
        attempted = int(r["attempted"] or 0)
        points = int(r["points"] or 0)
        return {
            "rank": int(r["rnk"]),
            "displayName": r["display_name"],
            "points": points,
            "days": int(r["days"] or 0),
            "accuracy": round(points / attempted, 3) if attempted else 0.0,
        }

    entries = [_entry(r) for r in rows]
    mine = None
    if my_rank is not None:
        attempted = int(my_rank["attempted"] or 0)
        points = int(my_rank["points"] or 0)
        mine = {
            "rank": int(my_rank["rnk"]),
            "points": points,
            "days": int(my_rank["days"] or 0),
            "accuracy": round(points / attempted, 3) if attempted else 0.0,
        }
    return {"reference": _utc_today_ref(), "entries": entries, "me": mine}
