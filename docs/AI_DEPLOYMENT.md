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

3. The frontend reads the server URL from `import.meta.env.VITE_AI_SERVER_URL` at build time. For local dev via the provided `docker-compose.yml`, the `frontend` service sets `VITE_AI_SERVER_URL` to `http://ai-server:8000` so calls from the container reach the ai-server by its Compose hostname.

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
