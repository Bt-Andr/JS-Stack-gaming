FSQ — AI server deployment notes (Render)

Overview
--------
This repo includes a minimal AI server at `ai-server/` (FastAPI). For production we recommend deploying this container to Render (or Railway/Fly).

Render (Docker) quick steps
---------------------------
1. Push your repo to GitHub.
2. On Render, create a new "Web Service".
   - Connect your GitHub repo and pick the branch.
   - Select "Docker" as the environment.
   - Set the Build Context to `/ai-server` (or the repo root if you prefer).
   - Set the Start Command: `uvicorn main:app --host 0.0.0.0 --port 8000` (default in Dockerfile already).
3. Expose port 8000 (Render maps automatically).
4. After deploy, note the service URL (e.g. `https://my-ai-service.onrender.com`).
5. In Vercel, set the environment variable `VITE_AI_SERVER_URL` to that URL (without trailing slash).

Render field recommendations
---------------------------
- Build Command: leave empty if using the Docker option (Render will use Dockerfile).
- Docker Context: `/ai-server` (or `.` if Dockerfile is at repo root).
- Port: 8000

Securing the endpoint (do this before going live)
--------------------------------------------------
Without these two env vars, `/api/v1/generate` is an **unauthenticated public proxy** —
anyone who finds the URL can call it, and if you're forwarding to a paid
`openai_compatible` upstream, they call it at your expense.

- `AI_API_KEY`: set to a random secret. Requests must then send it back as the
  `X-API-Key` header (the frontend already does this via `VITE_AI_API_TOKEN`).
  Note this only stops casual abuse — `VITE_*` values are bundled into the
  frontend's JS and visible to anyone opening DevTools.
- `AI_ALLOWED_ORIGINS`: set to your deployed frontend's origin, e.g.
  `https://my-app.vercel.app`. Defaults to `*` (any site can call it from a
  visitor's browser) if unset.

The server logs a warning at startup if either is left at its permissive default.

Cross-device profile sync (optional)
-------------------------------------
The same `ai-server` can also sync a player's progress across devices, via
`GET/PUT /api/v1/profile/{account}`. No database to manage — it's a thin proxy
to a free Upstash Redis instance, storing one JSON blob per account.

1. Create a free database at https://upstash.com (Redis, REST API).
2. Copy its **REST URL** and **REST token** from the Upstash console.
3. Set them as env vars on Render: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
4. In the app's "Synchro multi-appareils" panel, set the same account name (and
   optional PIN) on every device you want to share progress across.

This is intentionally lightweight, not real authentication: an account is just
a name (3-32 chars) plus an optional PIN checked on read/write. Anyone who
knows the account name (and PIN, if set) can read/write that profile. Fine for
personal use or sharing with friends/family; don't use it for sensitive data.
If the env vars are left empty, the profile routes return `503` and the app
falls back to `localStorage` only (still works, just doesn't sync).

Central question bank (optional)
---------------------------------
The `ai-server` also serves a centrally-managed question bank that merges into
the game's static questions on every device (offline-first: the app caches the
bank in localStorage and falls back to static questions without network).

1. Create a free Postgres database at https://neon.tech and copy its connection
   string.
2. Set on Render: `DATABASE_URL` (the Neon string — the schema is created
   automatically at first connection) and `ADMIN_API_KEY` (a long random secret,
   deliberately distinct from `AI_API_KEY`: the public key must never grant
   write access to the bank).
3. In the app, open the map's "Administration" panel, paste the admin key, and
   use the admin view to author QCM / code / refactor / order questions. Code and
   refactor exercises can't be published until a reference solution passes their
   tests. A **refactor** exercise ships a working-but-messy `starter` that must
   already pass the tests — the player cleans it up without breaking them, and
   the AI code review verdict is the reward. Only QCM questions feed the Daily
   Challenge and the Qualification exam (those views have no code editor).

Verification after deploy: `curl https://<render-url>/api/v1/questions` should
return `{"questions":[]}` (or your questions). Empty env vars -> clean 503s and
the app plays static-only.

Local-dev CORS gotcha: if you open the admin view from `http://localhost:5173`
against the deployed Render server, `AI_ALLOWED_ORIGINS` on Render must include
`http://localhost:5173` too (comma-separated), and `harness/.env.local` needs
`VITE_AI_SERVER_URL=https://<render-url>` so the harness targets Render instead
of `localhost:8000`.

Revue de code IA (`/api/v1/review`)
------------------------------------
En plus du coach (`/api/v1/generate`), le serveur expose `POST /api/v1/review` :
quand les tests d'un exercice de code passent, le front envoie l'énoncé, le
starter, les appels de test et la solution du joueur ; le modèle relit le code
comme en revue professionnelle (nommage, lisibilité, idiomes) et renvoie
`{verdict: "propre"|"a_polir"|null, comment}`. Le prompt système et le parsing
du verdict vivent côté serveur (`REVIEW_SYSTEM_PROMPT` dans `main.py`).

Deux modes via le champ `mode` du body : `"exercise"` (défaut — le code a des
tests exécutés et verts, la revue ne juge que la qualité) et `"chantier"` (le
joueur colle le code d'un jalon de son vrai projet ; rien n'est exécuté, la
revue juge sur lecture la conformité aux critères d'acceptation ET la qualité).
Chaque mode a son prompt système dans `main.py`.

Mêmes règles d'accès que `/generate` : compte + pass actif + quota journalier
(une revue consomme un indice du quota `aiDailyHints`), ou la clé partagée
`X-API-Key` pour l'admin et les tests. Le code est plafonné à 4 000 caractères
et la sortie à 350 tokens. Aucune variable d'environnement supplémentaire.

Vérification rapide : `curl -X POST https://<render-url>/api/v1/review -H "Content-Type: application/json" -d '{"prompt":"...","code":"function f(){}"}'`
(en provider `stub`, la réponse est une revue simulée avec `verdict: "a_polir"`).

Vercel configuration
---------------------
After your AI service is deployed on Render (or another provider), configure the frontend deployed on Vercel to call it:

1. Open your Vercel project settings.
2. Under "Environment Variables", add a new variable:
   - Key: `VITE_AI_SERVER_URL`
   - Value: `https://my-ai-service.onrender.com` (the Render service URL)
   - Environment: choose `Production` (and `Preview`/`Development` as needed)
3. Redeploy your Vercel project so `import.meta.env.VITE_AI_SERVER_URL` is available at build time.

Testing end-to-end locally
--------------------------

1. Build and run the `ai-server` locally with Docker Compose (from repo root):

```bash
docker-compose up --build
```

2. The frontend will be available at `http://localhost:5173` and the AI server at `http://localhost:8000`.

3. The frontend reads the server URL from `import.meta.env.VITE_AI_SERVER_URL` at build time. The fetch happens in the user's *browser*, not inside the container, so this must be an address the browser can reach — e.g. `http://localhost:8000` — not the Compose service hostname (`http://ai-server:8000`), which only resolves between containers.

Replacing the stub with a real model
-----------------------------------
- Replace the logic in `ai-server/main.py` with your model inference code. If you run a local inference server (vLLM, llama.cpp wrapper, or an API proxy), call it from the FastAPI handler.
- For heavy models, deploy to a GPU-enabled host or a managed inference provider.


Local development
-----------------
- Start both services with Docker Compose from the repo root:

```bash
docker-compose up --build
```

- The frontend will be available at `http://localhost:5173` and the AI server at `http://localhost:8000`.

Notes
-----
- The `ai-server` included is a stub for local testing. Replace the handler in `ai-server/main.py` with your model invocation (e.g., vLLM, local llama.cpp wrapper, or calls to an inference server).
- For heavier models, prefer a GPU-backed host or managed provider.
