# StartupSage

AI-powered startup idea validation with a council of adversarial failed-founder sages.

This repo contains the phase 0 hackathon baseline:

- `server/` FastAPI backend with SQLite, CORS, dummy agent, SSE stream, optional Gemini/OpenAI smoke hooks, and failed-startup seed data.
- `client/` React + Vite frontend with Home, Submit Idea, Live Session, and Report screens.
- `docs/api_schema.md` shared API contract.
- `.daytona/devcontainer.json` baseline shared dev environment config.

## Backend

```bash
cd server
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload
```

Use Python 3.11 or 3.12 for the smoothest backend setup. The base server avoids compiled extras, but provider SDKs can still bring native dependencies on alpha Python builds.

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Optional LLM smoke tests need API keys in `server/.env` and the AI SDK extras:

```bash
pip install -r requirements-ai.txt
```

```bash
curl "http://127.0.0.1:8000/llm/smoke?provider=gemini"
curl "http://127.0.0.1:8000/llm/smoke?provider=openai"
```

## Frontend

```bash
cd client
npm install
npm run dev
```

Optional API override:

```bash
cp .env.example .env
```

Then set `VITE_API_BASE_URL` if the backend is not running on `http://127.0.0.1:8000`.

## Phase 0 Checklist

- Backend project scaffolded
- FastAPI health check
- SQLite schema for sessions, messages, reports
- Gemini/OpenAI SDK hooks
- Agent base class and echo dummy agent
- SSE fake conversation stream
- Environment example
- 30 failed-startup seed records
- React client scaffold with Vite, Tailwind, shadcn-style primitives, routing, TanStack Query, and SSE handling
- Navigation and baseline screens
- Shared API contract

Git is intentionally not initialized yet.
