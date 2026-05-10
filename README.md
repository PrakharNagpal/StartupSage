<div align="center">

```
███████╗████████╗ █████╗ ██████╗ ████████╗██╗   ██╗██████╗
██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██║   ██║██╔══██╗
███████╗   ██║   ███████║██████╔╝   ██║   ██║   ██║██████╔╝
╚════██║   ██║   ██╔══██║██╔══██╗   ██║   ██║   ██║██╔═══╝
███████║   ██║  ██║  ██║██║  ██║   ██║   ╚██████╔╝██║
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝
```

**Your idea, judged by the founders who failed before you.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![OpenAI](https://img.shields.io/badge/Powered%20by-OpenAI-412991?style=flat-square&logo=openai)](https://platform.openai.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## Screenshots

<div align="center">
  <img src="docs/screenshot-landing.png" alt="StartupSage — The Founder's Council" width="48%" />
  &nbsp;&nbsp;
  <img src="docs/screenshot-submit.png" alt="StartupSage — State Your Case" width="48%" />
  <br/>
  <sub><b>Left:</b> The Founder's Council landing page &nbsp;|&nbsp; <b>Right:</b> State Your Case — idea submission screen</sub>
  <br/><br/>
  <img src="docs/screenshot-live-council.png" alt="StartupSage live council bench with active speaker" width="48%" />
  &nbsp;&nbsp;
  <img src="docs/screenshot-transcript-interjections.png" alt="StartupSage transcript showing multi-agent interjections" width="48%" />
  <br/>
  <sub><b>Left:</b> Active sage spotlight and courtroom bench &nbsp;|&nbsp; <b>Right:</b> Multi-agent transcript where sages challenge the founder and each other</sub>
  <br/><br/>
  <img src="docs/screenshot-verdict-delivered.png" alt="StartupSage verdict delivered screen" width="48%" />
  &nbsp;&nbsp;
  <img src="docs/screenshot-council-report.png" alt="StartupSage council report with survival score" width="48%" />
  <br/>
  <sub><b>Left:</b> Verdict ceremony &nbsp;|&nbsp; <b>Right:</b> Final council report with score, risks, and improvements</sub>
</div>

---

## The Premise

Every startup pitch gets torn apart eventually — by VCs, the market, or time itself. StartupSage lets you face that reckoning early, in a dramatic courtroom setting, before a council of three AI sages who embody the founders of **historically failed startups**.

Submit your idea. Defend it under oath. Receive your verdict.

The sages aren't cheerleaders. They've been burned. They know exactly how ideas like yours have collapsed before, and they won't let you off easy.

---

## What Happens

```
You submit a startup idea
        ↓
An AI researcher searches the failed-startup dataset and selects 3 relevant failure archetypes
        ↓
Three sages are summoned — each embodying a failed founder archetype
        ↓
A live council begins: one sage speaks, the active judge rises, and the transcript streams token-by-token
        ↓
The founder replies by text or voice
        ↓
A coordinator AI reads the full transcript and decides who should interject next
        ↓
Another sage can challenge the founder, reinforce a previous concern, or push back on another sage's premise
        ↓
Each sage delivers a verdict: Survives / Pivot / Rethink
        ↓
The Council generates a full report: survival score, risks, improvements,
closest historical parallel, and recommended next steps
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│                                                         │
│  React 18 · Vite · Tailwind · TanStack Query            │
│                                                         │
│  /            → Landing                                 │
│  /submit      → Idea submission                         │
│  /session/:id → Live courtroom  (SSE streaming)         │
│  /report/:id  → Full council report                     │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP + Server-Sent Events
┌────────────────────────▼────────────────────────────────┐
│                        SERVER                           │
│                                                         │
│  FastAPI · SQLite · sse-starlette                       │
│                                                         │
│  Sessions, messages, verdicts → SQLite                  │
│  Real-time events → asyncio.Queue → SSE stream          │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                     AGENT LAYER                         │
│                                                         │
│  Researcher      → identifies 3 relevant failed          │
│                    founder archetypes via GPT-4o mini    │
│                                                         │
│  Coordinator     → decides who speaks next based on     │
│                    transcript context, dodged answers,   │
│                    and coverage across risk lenses       │
│                                                         │
│  SageAgent (×3)  → streams adversarial questions and    │
│                    interjections, then delivers verdicts │
│                                                         │
│  ReportGenerator → synthesises the full council         │
│                    report using GPT-4o / GPT-4o mini     │
└─────────────────────────────────────────────────────────┘
```

---

## The Council

Three sages are dynamically assembled for each session based on your idea. The AI selects the most relevant failed founder archetypes from startup history and has each one challenge you from the angle of their specific failure.

Each sage internalises one hard lesson from their failure and challenges you specifically on whether your idea repeats it.

---

## Multi-Agent Interaction

StartupSage is not a single chatbot wearing three costumes. Each session creates a small adversarial council:

- **Researcher agent** selects the three failed startups most relevant to the submitted idea from the seed dataset.
- **Sage agents** each own one failure lens, such as logistics density, market timing, distribution, or unit economics.
- **Coordinator agent** watches the full transcript and decides which sage should speak next.
- **Report agent** converts the council's verdicts and transcript into a final founder-facing report.

The coordinator is the key piece. It does not just rotate speakers in a fixed order. After every founder reply, it can:

- keep pressure on the same sage if the answer was vague or dodged the question
- hand the floor to another sage whose failure lens is now more relevant
- let a sage directly react to another sage's concern, creating an interjection rather than a disconnected Q&A
- decide when the council has enough evidence to move from questioning into verdicts

In the live session, this creates exchanges like:

```text
Sprig asks about vertical integration and high operating costs.
Founder answers that the product will stay asset-light through partners.
Webvan interjects on partner reliability and operational readiness.
Zume Pizza follows by warning that logistics failures can damage retention.
```

Those interjections are reflected in the UI through `active_sage` SSE events: the speaking judge rises on the bench, receives the spotlight, and the reply box targets the current sage.

---

## Features

- **Live streaming courtroom** — sage responses appear word-by-word via Server-Sent Events
- **Animated council bench** — the active judge stands forward, speaks under a spotlight, and idle judges stay seated
- **Multi-agent interjections** — sages can challenge the founder and respond to each other's concerns
- **AI coordinator** — dynamically decides who challenges you next based on transcript coverage and answer quality
- **Voice-ready flow** — founders can answer by text or microphone, and sage responses can be replayed as judge audio
- **Collapsible transcript** — filter by sage, collapse to focus on the bench
- **Verdict ceremony** — full-page reveal with animated seal and per-sage verdict pills
- **Survival score dial** — CSS conic-gradient score from 0 to 100
- **Detailed council report** — risks, improvements, historical parallel, and next steps

---

## Quickstart

### Prerequisites

- Node.js 18+
- Python 3.11+
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone

```bash
git clone https://github.com/your-org/startupsage.git
cd startupsage
```

### 2. Backend

```bash
cd server
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-ai.txt
```

Add your OpenAI key:

```bash
cp .env.example .env
# Open .env and set OPENAI_API_KEY=your_key_here
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

Verify it's running:

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** (or whichever port Vite prints).

---

## Environment Variables

### Server — `server/.env`

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `DATABASE_PATH` | No | Path to SQLite database file |
| `OPENAI_TRANSCRIPTION_MODEL` | No | Audio transcription model |
| `OPENAI_TTS_MODEL` | No | Text-to-speech model for judge audio |
| `OPENAI_TTS_FORMAT` | No | Generated judge audio format |
| `HYPERSPELL_API_KEY` | No | Optional memory recall for prior exchanges |

### Client — `client/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | No | Backend base URL (default: `http://localhost:8000`) |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/sessions` | Create a new session |
| `POST` | `/sessions/:id/research` | Summon the council for an idea |
| `GET` | `/sessions/:id/stream` | SSE stream of all sage events |
| `POST` | `/sessions/:id/messages` | Send a reply to the council |
| `GET` | `/sessions/:id/report` | Retrieve the full council report |
| `POST` | `/sessions/:id/transcribe` | Transcribe audio input to text |

### SSE Event Types

```
sage_token     → { sage_id, token }          streaming word
sage_done      → { sage_id, round }          sage finished speaking
active_sage    → { sage_id }                 focus indicator
verdict        → { sage_id, verdict, rationale }
report_ready   → { session_id }
session_ending → {}
done           → { session_id }
```

### Report Schema

```json
{
  "survival_score": 72,
  "overall_verdict": "...",
  "council_summary": {
    "consensus": "We believe...",
    "what_we_liked": ["...", "..."],
    "verdict": "pivot"
  },
  "top_risks": ["...", "...", "..."],
  "top_improvements": ["...", "...", "..."],
  "closest_parallel": { "name": "...", "why": "..." },
  "next_steps": ["...", "...", "..."]
}
```

---

## Project Structure

```
startupsage/
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx           ← Landing screen
│       │   ├── SubmitIdea.jsx     ← Idea submission
│       │   ├── LiveSession.jsx    ← Courtroom + live streaming
│       │   └── Report.jsx         ← Council report
│       ├── components/
│       │   ├── layout/            ← PageShell, navigation
│       │   └── ui/                ← Button, Card, Badge, AlertDialog…
│       ├── hooks/
│       │   └── useSSE.js          ← EventSource consumer hook
│       └── lib/
│           ├── api.js             ← All API calls
│           ├── report.js          ← Report normalisation helpers
│           └── sages.js           ← Session sage persistence
│
└── server/
    ├── main.py                    ← FastAPI app + all routes
    ├── database.py                ← SQLite setup + CRUD
    ├── schemas.py                 ← Pydantic request/response models
    ├── sse_router.py              ← asyncio.Queue → SSE stream
    └── agents/
        ├── researcher.py          ← Matches idea to failed startups
        ├── coordinator.py         ← Decides who speaks next
        ├── sage_agent.py          ← Single sage: questions + verdict
        ├── sage_orchestrator.py   ← Orchestrates all 3 sages per round
        ├── report_generator.py    ← Generates the final report
        ├── memory.py              ← Per-sage conversation memory
        ├── prompts.py             ← All LLM prompt templates
        └── failed_startups.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Data fetching | TanStack Query v5 |
| Routing | React Router v6 |
| Real-time | Server-Sent Events (native `EventSource`) |
| Backend | FastAPI 0.110 |
| Database | SQLite (via raw `sqlite3`, no ORM) |
| SSE streaming | sse-starlette |
| AI — all agents | GPT-4o mini |
| AI — report synthesis | GPT-4o, falling back to GPT-4o mini |
| AI — transcription | GPT-4o mini transcribe |
| AI — voice | GPT-4o mini TTS |
| Icons | Lucide React |

---

## The Survival Score

The council scores your idea from 0 to 100 based on how well you defended it:

```
Start at 50

+10  Demonstrated real market understanding
+10  Clear, credible distribution strategy
+10  Plausible unit economics
+10  Right timing argument

−15  Broken unit economics with no answer
−15  No distribution plan at all
−10  Market timing clearly wrong
−10  Dodged critical questions repeatedly
```

| Score | Verdict |
|---|---|
| 70–100 | Survives |
| 45–69 | Pivot |
| 0–44 | Rethink |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Keep frontend changes in `/client`, backend in `/server`, agents in `/server/agents`
4. Open a PR against `main`

---

<div align="center">

*"Every startup that failed thought it wouldn't.*
*Every founder who succeeded faced someone who said it would."*

</div>
