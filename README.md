# StartupSage

AI-powered startup idea validation with a council of adversarial failed-founder sages.

This repo contains the phase 0 hackathon baseline:

- `server/` FastAPI backend with SQLite, CORS, dummy agent, SSE stream, optional Gemini/OpenAI smoke hooks, and failed-startup seed data.
- `app/` Flutter app with Home, Submit Idea, Live Session, and Report screens.
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
cd app
flutter pub get
flutter run -d chrome --web-port 5858 --dart-define=API_BASE_URL=http://127.0.0.1:8000
```

The app can still run if the backend is offline; it falls back to baseline demo data for the live session and report.

## Phase 0 Checklist

- Backend project scaffolded
- FastAPI health check
- SQLite schema for sessions, messages, reports
- Gemini/OpenAI SDK hooks
- Agent base class and echo dummy agent
- SSE fake conversation stream
- Flutter CORS origins configured
- Environment example
- 30 failed-startup seed records
- Flutter project with Riverpod, Dio, markdown rendering, and audio dependency
- Navigation and baseline screens
- Shared API contract

Git is intentionally not initialized yet.
