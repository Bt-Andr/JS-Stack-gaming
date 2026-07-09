"""Seed idempotent d'un compte de démo, exécuté au démarrage du conteneur.

Utilité : donner un compte prêt à tester le mur de paiement sans repasser par
le jeu (fondation terminée, pas de pass actif -> secteurs avancés/Qualification
bloqués et affichent l'offre). N'agit que si SEED_DEMO_ACCOUNT=1 est défini ;
sans quoi ce script ne fait rien (à couper en production réelle).

Identifiants réglables via env (défauts pensés pour un test rapide) :
  SEED_DEMO_EMAIL, SEED_DEMO_PASSWORD, SEED_DEMO_NAME
"""

import asyncio
import json
import os
import sys

import bcrypt

import core

EMAIL = os.getenv("SEED_DEMO_EMAIL", "demo-bloque@test.cm").strip().lower()
PASSWORD = os.getenv("SEED_DEMO_PASSWORD", "demo1234")
DISPLAY_NAME = os.getenv("SEED_DEMO_NAME", "Testeur Bloqué")

SEEDED_PROFILE = {
    "xp": 300,
    "results": {
        "js-fond": {"passed": True, "bestScore": 90, "flawless": False},
        "js-avance": {"passed": True, "bestScore": 85, "flawless": False},
        "async": {"passed": True, "bestScore": 88, "flawless": False},
    },
    "badges": [],
    "lore": [],
    "bestCombo": 3,
    "meta": {"version": 4, "features": {"daily": True, "srs": True, "chantier": True, "qualification": True}},
    "dailyRuns": {},
    "srsState": {},
    "chantier": {"milestones": {}},
    "qualification": {"passed": False, "bestScore": 0, "attempts": 0},
    "technical": {},
}


async def main() -> None:
    if os.getenv("SEED_DEMO_ACCOUNT", "").strip() != "1":
        print("[seed] SEED_DEMO_ACCOUNT != 1, rien à faire.")
        return
    if not core.db_available():
        print("[seed] DATABASE_URL absente, seed ignoré.")
        return

    pool = await core.get_pool()
    password_hash = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("ascii")
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) "
            "ON CONFLICT (email) DO UPDATE SET password_hash = $3 "
            "RETURNING id",
            EMAIL, DISPLAY_NAME, password_hash,
        )
        await conn.execute(
            "INSERT INTO user_profiles (user_id, profile, updated_at) VALUES ($1, $2, now()) "
            "ON CONFLICT (user_id) DO UPDATE SET profile = $2, updated_at = now()",
            user["id"], json.dumps(SEEDED_PROFILE),
        )
        # Repart d'un pass propre à chaque redeploy pour retester le paiement.
        await conn.execute("DELETE FROM passes WHERE user_id = $1", user["id"])

    print(f"[seed] Compte prêt -> email={EMAIL} mot_de_passe={PASSWORD} (fondation terminée, pas de pass).")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:  # ne bloque jamais le démarrage du serveur
        print(f"[seed] Échec du seed (ignoré) : {exc}", file=sys.stderr)
