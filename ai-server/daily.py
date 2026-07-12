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

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

import accounts
import core

router = APIRouter()

# Borne de sécurité : un défi ne peut pas contenir plus de questions qu'il n'y
# a de modules (marge large).
MAX_DAILY_QUESTIONS = 50


def _utc_today_ref() -> str:
    now = datetime.now(timezone.utc)
    return f"{now.year:04d}-{now.month:02d}-{now.day:02d}"


MAX_REASONING_CHARS = 500


class DailyAnswer(BaseModel):
    hash: str                 # content_hash de la question (moduleId|qcm|prompt)
    selected: Optional[int] = None
    reasoning: Optional[str] = None  # texte libre facultatif ("pourquoi ce choix ?") — jamais noté, jamais jugé ici


class DailySubmitIn(BaseModel):
    reference: str            # "YYYY-MM-DD" (UTC) — doit être le jour courant
    answers: List[DailyAnswer] = []
    durationMs: int = 0


@router.post("/api/v1/daily/submit")
async def submit_daily(body: DailySubmitIn, user: Dict[str, Any] = Depends(accounts.required_user)):
    core.require_db()
    # Le serveur fait autorité sur la date : on refuse un référentiel qui n'est
    # pas le jour UTC courant (anti-antidatage / rejeu d'un ancien défi).
    if body.reference != _utc_today_ref():
        raise HTTPException(status_code=409, detail="Ce défi n'est plus celui d'aujourd'hui — recharge l'application.")
    if len(body.answers) > MAX_DAILY_QUESTIONS:
        raise HTTPException(status_code=400, detail="Défi invalide (trop de réponses).")

    # Le serveur fait autorité sur le SCORE : le client n'envoie que ses réponses
    # (hash de question + option choisie), jamais un score. On corrige chaque
    # réponse contre la bonne réponse stockée en banque. Une question absente de
    # la banque n'est pas notée (exclue du total, ni juste ni fausse) — le
    # classement ne dépend donc que de questions vérifiables côté serveur.
    hashes = list({a.hash for a in body.answers if a.hash})  # dédoublonnés
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT content_hash, module_id, payload FROM questions "
            "WHERE content_hash = ANY($1) AND status='active' AND qtype='qcm'",
            hashes,
        ) if hashes else []
        by_hash = {}
        for r in rows:
            payload = r["payload"]
            if isinstance(payload, str):
                payload = json.loads(payload)
            by_hash[r["content_hash"]] = {"module_id": r["module_id"], "correct": payload.get("correct")}

        score = 0
        total = 0
        seen_hashes = set()
        seen_modules = set()
        # Collecte pure (Phase 6) : jamais lu par le calcul de score ci-dessous,
        # jamais jugé ici — juste stocké pour une future analyse. Accepté pour
        # TOUTE réponse taguée (pas seulement les fausses) : plus simple côté
        # serveur, et le client ne propose l'input qu'après une mauvaise réponse.
        reasoning: Dict[str, str] = {}
        for a in body.answers:
            if a.reasoning and a.reasoning.strip() and a.hash not in reasoning:
                reasoning[a.hash] = a.reasoning.strip()[:MAX_REASONING_CHARS]
            q = by_hash.get(a.hash)
            if q is None or a.hash in seen_hashes:
                continue  # inconnue en banque, ou doublon : non notée
            # Classement ÉQUITABLE : on ne note que les modules de fondation,
            # communs à TOUS (avec ou sans pass). Les secteurs avancés, réservés
            # au pass, sont un bonus hors classement — sinon un non-abonné
            # plafonne à 3 questions et un abonné à 9, ce qui fausse la comparaison.
            if q["module_id"] not in core.FOUNDATION_MODULES:
                continue
            # Anti-cherry-pick : une seule question comptée par module (le défi
            # légitime en tire une par secteur).
            if q["module_id"] in seen_modules:
                continue
            seen_hashes.add(a.hash)
            seen_modules.add(q["module_id"])
            total += 1
            if a.selected is not None and a.selected == q["correct"]:
                score += 1

        duration = max(0, int(body.durationMs))
        # Une seule tentative comptée par jour : la première gagne (c'est un
        # examen, pas un entraînement rejouable pour améliorer son rang).
        row = await conn.fetchrow(
            "INSERT INTO daily_results (user_id, day, score, total, duration_ms, reasoning) "
            "VALUES ($1, (now() at time zone 'utc')::date, $2, $3, $4, $5) "
            "ON CONFLICT (user_id, day) DO NOTHING "
            "RETURNING score, total",
            user["id"], score, total, duration, json.dumps(reasoning),
        )
    # Idempotent : si le jour était déjà enregistré, on renvoie ok sans écraser.
    return {"ok": True, "dailyDoneToday": True, "recorded": row is not None, "score": score, "total": total}


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


# Fenêtres de classement. `period` est validé contre cet ensemble fixe puis
# interpolé dans le SQL — aucune injection possible (valeurs closes).
_PERIOD_WHERE = {
    "today": "WHERE d.day = (now() at time zone 'utc')::date",
    "week": "WHERE d.day > (now() at time zone 'utc')::date - 7",
    "all": "",
}


@router.get("/api/v1/leaderboard")
async def leaderboard(
    period: str = "all",
    limit: int = 100,
    authorization: Optional[str] = Header(default=None),
):
    """Classement par performance au Défi Quotidien : cumul de bonnes réponses
    (récompense la régularité), départage par précision. Public.

    `period` = today | week | all : « qui est bon aujourd'hui / cette semaine »
    en plus du all-time, pour que les nouveaux puissent rivaliser."""
    core.require_db()
    if period not in _PERIOD_WHERE:
        period = "all"
    day_where = _PERIOD_WHERE[period]
    limit = max(1, min(int(limit), 200))
    pool = await core.get_pool()
    # Le rang de l'appelant est renvoyé même s'il est hors du top affiché.
    me = None
    try:
        me = await accounts.optional_user(authorization)
    except HTTPException:
        me = None  # session expirée : le classement reste consultable en invité

    agg = (
        f"SELECT d.user_id, sum(d.score) AS points, count(*) AS days, sum(d.total) AS attempted "
        f"FROM daily_results d {day_where} GROUP BY d.user_id"
    )
    order = (
        "ORDER BY a.points DESC, (a.points::float / NULLIF(a.attempted, 0)) DESC, a.days DESC"
    )
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"WITH agg AS ({agg}), "
            f"ranked AS (SELECT a.*, u.display_name, u.id AS uid, rank() OVER ({order}) AS rnk "
            f"           FROM agg a JOIN users u ON u.id = a.user_id) "
            f"SELECT * FROM ranked ORDER BY rnk LIMIT $1",
            limit,
        )
        my_rank = None
        if me is not None:
            my_rank = await conn.fetchrow(
                f"WITH agg AS ({agg}), "
                f"ranked AS (SELECT a.*, rank() OVER ({order}) AS rnk FROM agg a) "
                f"SELECT rnk, points, days, attempted FROM ranked WHERE user_id = $1",
                me["id"],
            )

    def _entry(r):
        attempted = int(r["attempted"] or 0)
        points = int(r["points"] or 0)
        return {
            "rank": int(r["rnk"]),
            "displayName": r["display_name"],
            "userId": str(r["uid"]),
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
    return {"reference": _utc_today_ref(), "period": period, "entries": entries, "me": mine}


@router.get("/api/v1/profile/{user_id}")
async def public_profile(user_id: str):
    """Profil PUBLIC en lecture seule : de quoi servir de référence (PIP) sans
    rien exposer de sensible — nom d'affichage + parcours pédagogique + Défi.
    Jamais d'email. Adressé par l'identifiant opaque du compte (non énumérable)."""
    core.require_db()
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Profil introuvable.")
    pool = await core.get_pool()
    async with pool.acquire() as conn:
        urow = await conn.fetchrow("SELECT id, display_name, created_at FROM users WHERE id = $1", uid)
        if urow is None:
            raise HTTPException(status_code=404, detail="Profil introuvable.")
        prow = await conn.fetchrow("SELECT profile FROM user_profiles WHERE user_id = $1", uid)
        agg = await conn.fetchrow(
            "SELECT sum(score) AS points, count(*) AS days, sum(total) AS attempted "
            "FROM daily_results WHERE user_id = $1",
            uid,
        )
        rank = await conn.fetchval(
            "WITH agg AS (SELECT user_id, sum(score) AS points, count(*) AS days, sum(total) AS attempted "
            "             FROM daily_results GROUP BY user_id), "
            "ranked AS (SELECT user_id, rank() OVER (ORDER BY points DESC, "
            "           (points::float/NULLIF(attempted,0)) DESC, days DESC) AS rnk FROM agg) "
            "SELECT rnk FROM ranked WHERE user_id = $1",
            uid,
        )
        streak_rows = await conn.fetch(
            "SELECT day FROM daily_results WHERE user_id = $1 ORDER BY day DESC LIMIT 400", uid
        )

    profile = prow["profile"] if prow else None
    if isinstance(profile, str):
        profile = json.loads(profile)
    profile = profile or {}
    results = profile.get("results") or {}
    sectors_done = sum(1 for r in results.values() if isinstance(r, dict) and r.get("passed"))
    skills = profile.get("skills") or {}
    qualification = profile.get("qualification") or {}
    points = int((agg["points"] if agg else 0) or 0)
    attempted = int((agg["attempted"] if agg else 0) or 0)

    return {
        "displayName": urow["display_name"],
        "memberSince": urow["created_at"].isoformat(),
        "xp": int(profile.get("xp") or 0),
        "sectorsCompleted": sectors_done,
        "qualificationPassed": bool(qualification.get("passed")),
        "qualificationBestScore": int(qualification.get("bestScore") or 0),
        "badges": list(profile.get("badges") or []),
        "skills": {
            "reviewed": int(skills.get("reviewed") or 0),
            "clean": int(skills.get("clean") or 0),
            "weakAxes": skills.get("weakAxes") or {},
        },
        "daily": {
            "rank": int(rank) if rank else None,
            "points": points,
            "days": int((agg["days"] if agg else 0) or 0),
            "accuracy": round(points / attempted, 3) if attempted else 0.0,
            "streak": accounts._compute_streak([r["day"] for r in streak_rows]),
        },
    }
