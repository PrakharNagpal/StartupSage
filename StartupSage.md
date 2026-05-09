# StartupSage — 3-Person, 5-Hour Build Plan
> Vibe-coding with Codex. React + shadcn/ui frontend. Multi-agent FastAPI backend. Zero collisions.

---

## THE SPLIT AT A GLANCE

| Person | Role | Owns |
|--------|------|------|
| **Dev A** | Frontend | React app, shadcn/ui, all screens, SSE consumer |
| **Dev B** | Backend Lead | FastAPI server, session/DB layer, SSE streaming, orchestration |
| **Dev C** | Agent Engineer | All AI agents (Researcher, 3 Sages, Report Generator), prompts, Gemini calls |

> Dev B and Dev C share the same repo folder `/server` but **never touch the same files**.
> Dev A lives entirely in `/client`.

---

## SHARED API CONTRACT (agree before splitting — 15 min, all three together)

### Base URL: `http://localhost:8000`

```
POST   /sessions                  → { session_id, status }
POST   /sessions/:id/research     → { sages: [{id, name, persona, failed_startup}] }
GET    /sessions/:id/stream       → SSE stream of sage messages (token by token)
POST   /sessions/:id/messages     → { role: "user", content: "..." }  →  triggers next sage turn
GET    /sessions/:id/report       → full report JSON
```

### SSE Event shape (Dev A consumes, Dev B emits):
```json
{ "event": "sage_token",   "data": { "sage_id": "sage_1", "token": "Have you..." } }
{ "event": "sage_done",    "data": { "sage_id": "sage_1", "round": 1 } }
{ "event": "verdict",      "data": { "sage_id": "sage_1", "verdict": "pivot", "rationale": "..." } }
{ "event": "report_ready", "data": { "session_id": "abc123" } }
```

### Report JSON shape (Dev C produces, Dev A renders):
```json
{
  "survival_score": 72,
  "overall_verdict": "...",
  "sage_verdicts": [
    { "sage_id": "sage_1", "sage_name": "...", "persona": "...", "verdict": "pivot", "rationale": "..." }
  ],
  "top_risks": ["...", "...", "..."],
  "top_improvements": ["...", "...", "..."],
  "closest_parallel": { "name": "...", "why": "..." },
  "next_steps": ["...", "...", "..."]
}
```

**Lock this in. Don't break it mid-build. Any change = shout in group chat.**

---

---

# DEV A — FRONTEND
### Stack: React + Vite + shadcn/ui + Tailwind + TanStack Query

---

## Hour 0–0:30 | Scaffold

**Codex prompt to start:**
> "Create a React + Vite project with shadcn/ui, Tailwind CSS, and React Router v6. Set up 4 routes: `/` (Home), `/submit` (Submit Idea), `/session/:id` (Live Session), `/report/:id` (Report). Use a dark theme. Add a global layout component with no navbar — full screen for each route."

- Install: `npm create vite@latest client -- --template react`, then add shadcn, router, tanstack query
- Set theme: dark background `#0a0a0a`, accent gold `#d4a847`, text `#e8e8e8`
- Commit: `feat: scaffold`

---

## Hour 0:30–1:30 | All 4 Screens (structure only, no real API calls yet)

**Screen 1 — Home (`/`)**

Codex prompt:
> "Build a dramatic home screen for 'StartupSage' — a startup idea validator. Dark theme (#0a0a0a background, gold #d4a847 accent). Three sage silhouette icons at the top. Title 'StartupSage' in large serif font. Subtitle: 'Your idea, judged by the founders who failed before you.' One CTA button 'Submit Your Idea' using shadcn Button. Use Cinzel or Playfair Display font from Google Fonts. Add a subtle animated gradient background."

---

**Screen 2 — Submit Idea (`/submit`)**

Codex prompt:
> "Build a Submit Idea screen. Dark theme. Large textarea (shadcn Textarea) with placeholder 'Describe your startup idea in 2–3 sentences...'. Character count below (max 500). A shadcn Button 'Face the Council'. Below the button, small text: 'You will be challenged by 3 AI sages embodying real failed founders.' On submit, POST to /sessions then POST to /sessions/:id/research, show a loading spinner with text 'Summoning the council...' while waiting. Navigate to /session/:id on success."

---

**Screen 3 — Live Session (`/session/:id`)**

Codex prompt:
> "Build a Live Session screen. Dark theme. At the top, show 3 sage cards side by side — each has a circular avatar (use a placeholder gradient), sage name, and their failed startup persona below. Below the sage cards, a chat-style message feed. Each message bubble shows: sage name tag, message text that streams in token-by-token from an SSE connection to GET /sessions/:id/stream. At the bottom, a text input and Send button. When user sends a message, POST to /sessions/:id/messages. Show a round indicator: 'Round 1 of 2'. When a verdict event arrives, show a verdict badge on each sage card (Survives / Pivot / Rethink in green/yellow/red). When report_ready event arrives, show a 'View Report' button."

SSE consumer logic:
```js
// Codex prompt: "Write a useSSE React hook that connects to a URL, 
// parses JSON event data, and returns an array of events. 
// Reconnect automatically on disconnect."
```

---

**Screen 4 — Report (`/report/:id`)**

Codex prompt:
> "Build a Report screen. Fetch from GET /sessions/:id/report. Show: (1) A large circular score dial (0–100) using a CSS conic-gradient — gold fill for the score, dark for the remainder. (2) 'Overall Verdict' paragraph. (3) Three sage verdict cards (name, failed startup, verdict badge, rationale). (4) Two columns: 'Top Risks' and 'Suggested Improvements' as lists with bullet icons. (5) 'Closest Historical Parallel' as a highlighted card. (6) 'Recommended Next Steps' numbered list. (7) A 'Start Over' button. Use shadcn Card, Badge, Separator components throughout."

---

## Hour 1:30–3:00 | Wire Up Real Backend + Polish

- Replace all hardcoded data with real API calls using TanStack Query
- Wire SSE stream to actually append tokens to message bubbles
- Add loading/error states to every screen (shadcn Skeleton, Alert)
- Add smooth scroll to bottom of chat as messages stream in
- Test end-to-end with Dev B's stub endpoints

Codex prompt for error states:
> "Add error boundary and loading skeleton states to all 4 screens. Use shadcn Skeleton for loading. Show a shadcn Alert with variant='destructive' for errors with a Retry button."

---

## Hour 3:00–4:00 | Polish + Demo Prep

- Add page transition animations (fade in on route change)
- Add a "Demo idea" button on the Submit screen with a pre-filled idea (for live demo safety)
- Make the sage cards animate in one by one after research completes
- Make verdict badges animate in with a pulse effect
- Test on a second browser window / mobile emulator

Codex prompt:
> "Add a 'Try a demo idea' button that fills the textarea with: 'An AI-powered meal planning app that generates weekly grocery lists and recipes based on your dietary preferences and budget, then auto-orders from Instacart.' Style it as a ghost button below the main CTA."

---

## Hour 4:00–5:00 | Buffer + Integration Testing

- Sit with Dev B and Dev C for end-to-end run
- Fix any SSE parsing issues
- Record a backup screen recording of a full session
- Final deploy to Vercel: `vercel --prod`

---

---

# DEV B — BACKEND LEAD
### Stack: FastAPI + SQLite + SSE-Starlette + Pydantic

### Files you own:
```
/server
  main.py          ← FastAPI app, all routes
  database.py      ← SQLite setup, models, CRUD
  schemas.py       ← Pydantic request/response schemas
  session_manager.py ← session state machine
  sse_router.py    ← SSE streaming logic
  .env.example
  requirements.txt
```
> Dev C owns: `/server/agents/` — you never edit files in there.

---

## Hour 0–0:30 | Scaffold

**Codex prompt:**
> "Create a FastAPI project in Python 3.11. Files: main.py, database.py, schemas.py. Set up SQLite with raw sqlite3 (no ORM). Create two tables: sessions (id TEXT PRIMARY KEY, idea_text TEXT, status TEXT, created_at TEXT, current_round INTEGER) and messages (id TEXT PRIMARY KEY, session_id TEXT, role TEXT, content TEXT, round_number INTEGER, timestamp TEXT). Add a GET /health endpoint. Add CORS middleware allowing all origins. Use uvicorn to run."

Install: `pip install fastapi uvicorn sse-starlette pydantic python-dotenv httpx`

---

## Hour 0:30–1:30 | Core Endpoints

**Codex prompt 1 — POST /sessions:**
> "Add POST /sessions to main.py. Request body: { idea_text: str }. Generate a UUID for session id. Insert into SQLite sessions table with status='idle'. Return { session_id, status }."

**Codex prompt 2 — POST /sessions/:id/research:**
> "Add POST /sessions/:id/research. Update session status to 'researching'. Import and call agents.researcher.run(idea_text) — assume this function exists and returns a list of 3 sage dicts with keys: id, name, persona, failed_startup. Update session status to 'in_session'. Return the sage list. If agents module isn't ready yet, return 3 hardcoded stubs so frontend can proceed."

Hardcoded stub (use until Dev C's agent is ready):
```python
STUB_SAGES = [
    {"id": "sage_1", "name": "The Distribution Skeptic", "persona": "Quibi founder", "failed_startup": "Quibi"},
    {"id": "sage_2", "name": "The Timing Realist", "persona": "Webvan founder", "failed_startup": "Webvan"},
    {"id": "sage_3", "name": "The Unit Economics Hawk", "persona": "Jawbone founder", "failed_startup": "Jawbone"},
]
```

**Codex prompt 3 — POST /sessions/:id/messages:**
> "Add POST /sessions/:id/messages. Request body: { content: str }. Insert a user message into the messages table with role='user'. Then call agents.sage_orchestrator.handle_user_message(session_id, content) — assume this returns nothing, it triggers the sages async. Increment current_round if all sages have responded this round. Return { status: 'ok' }."

**Codex prompt 4 — GET /sessions/:id/report:**
> "Add GET /sessions/:id/report. Read session from SQLite. Call agents.report_generator.get_report(session_id) — assume it returns the full report dict. Return it as JSON."

---

## Hour 1:30–2:30 | SSE Streaming

This is your most complex piece. Do this carefully.

**Codex prompt:**
> "Create sse_router.py. Use sse-starlette. Add GET /sessions/:id/stream as a StreamingResponse. Use an asyncio.Queue stored in a global dict keyed by session_id. The endpoint pulls from the queue and yields events as SSE. Add a helper function push_event(session_id, event_type, data_dict) that puts to the queue — this will be called by the agent layer. Register this router in main.py."

```python
# The pattern Dev C will use to push events:
from sse_router import push_event
await push_event(session_id, "sage_token", {"sage_id": "sage_1", "token": "..."})
await push_event(session_id, "sage_done",  {"sage_id": "sage_1", "round": 1})
await push_event(session_id, "verdict",    {"sage_id": "sage_1", "verdict": "pivot", "rationale": "..."})
await push_event(session_id, "report_ready", {"session_id": session_id})
```

Share `push_event` with Dev C immediately after writing it.

---

## Hour 2:30–4:00 | Integration + Testing

- Write a test script `test_flow.py` that simulates a full session:
  1. POST /sessions
  2. POST /sessions/:id/research
  3. Open SSE stream in a thread
  4. POST /sessions/:id/messages twice
  5. GET /sessions/:id/report
- Run alongside Dev C's agents as they come online
- Fix any async/await issues in the streaming

**Codex prompt:**
> "Write a Python test script using httpx and sseclient-py that runs the full session flow against localhost:8000 and prints every SSE event as it arrives."

---

## Hour 4:00–5:00 | Buffer + Deploy

- Fix bugs found in joint testing
- Deploy to Railway or run locally for demo
- Add a `demo_reset.py` script that clears the SQLite DB — useful between demo runs

---

---

# DEV C — AGENT ENGINEER
### Stack: Gemini Flash (sages + researcher) + Gemini Pro (report)

### Files you own:
```
/server/agents/
  __init__.py
  researcher.py         ← Researcher Agent
  sage_orchestrator.py  ← Runs all 3 sages in sequence/parallel
  sage_agent.py         ← Single sage class (reused 3x)
  report_generator.py   ← Report Agent
  prompts.py            ← All prompt templates
  failed_startups.json  ← Seed data (30 failed startups)
```
> You never touch main.py, database.py, or sse_router.py.
> You call `push_event()` from sse_router — Dev B gives you this function.

---

## Hour 0–0:30 | Scaffold + Seed Data

**Codex prompt:**
> "Create /server/agents/__init__.py and /server/agents/failed_startups.json. The JSON is a list of 30 famous failed startups, each with: name, year_founded, year_failed, sector, one_line_pitch, primary_failure_reason, key_lessons (list of 3 strings). Include: Quibi, Juicero, Theranos, Webvan, Pets.com, Color Labs, Beepi, Jawbone, MoviePass, Rdio, Vine, Google+, Yik Yak, Meerkat, Homejoy, Sprig, Washio, Shyp, Zume Pizza, Bodega, Clinkle, Fab.com, Quirky, Everpix, Secret, Vessel, Aereo, Solyndra, Better Place, Segway."

---

## Hour 0:30–1:30 | Researcher Agent

**Codex prompt:**
> "Create /server/agents/researcher.py. It has one async function: run(idea_text: str) -> list[dict]. It loads failed_startups.json. Then calls Gemini Flash API (google-generativeai SDK) with this prompt: given the startup idea, find the 3 most relevant failed startups from the provided list. Return ONLY a JSON array — no markdown, no explanation — where each item has: id (sage_1/2/3), name (a sage archetype name), persona (short description), failed_startup (company name from the list), failure_lesson (one sentence on what killed them). Use the GEMINI_API_KEY from environment. If Gemini fails, fall back to returning the first 3 items from the JSON as stubs."

Then write `/server/agents/prompts.py`:

**Codex prompt:**
> "Create prompts.py with these 3 string templates (use Python f-string format):
> 1. RESEARCHER_PROMPT: Takes idea_text and startups_json. Instructs Gemini to pick 3 most relevant failed startups and return pure JSON array.
> 2. SAGE_OPENING_PROMPT: Takes sage_name, failed_startup_name, failure_lesson, idea_text. Sage introduces themselves in character as a failed founder, then asks ONE sharp adversarial question about why this idea won't fail the same way they did. Max 3 sentences total.
> 3. SAGE_FOLLOWUP_PROMPT: Takes sage_name, failure_lesson, idea_text, conversation_history. Sage responds to the user's answer and asks one follow-up. Still adversarial, grounded in their failure. Max 3 sentences.
> 4. SAGE_VERDICT_PROMPT: Takes sage_name, failure_lesson, idea_text, full_conversation. Sage delivers verdict: Survives / Pivot / Rethink. Then one paragraph of rationale. Return JSON: { verdict: 'survives'|'pivot'|'rethink', rationale: '...' }.
> 5. REPORT_PROMPT: Takes idea_text, all_verdicts, full_transcript. Returns a full report JSON matching the agreed schema."

---

## Hour 1:30–3:00 | Sage Agent + Orchestrator

**Codex prompt for sage_agent.py:**
> "Create /server/agents/sage_agent.py. Class SageAgent with: __init__(sage_id, name, persona, failed_startup, failure_lesson). Async method opening_message(idea_text) -> str: calls Gemini Flash with SAGE_OPENING_PROMPT, returns text. Async method followup(idea_text, conversation_history) -> str: calls Gemini Flash with SAGE_FOLLOWUP_PROMPT, returns text. Async method verdict(idea_text, conversation_history) -> dict: calls Gemini Flash with SAGE_VERDICT_PROMPT, parses JSON response, returns dict with verdict and rationale. All Gemini calls use streaming=False for simplicity first — we'll add streaming after."

**Codex prompt for sage_orchestrator.py:**
> "Create /server/agents/sage_orchestrator.py. It keeps a dict of active SageAgent instances keyed by session_id. Function init_sages(session_id, sage_data_list) stores 3 SageAgents. Async function handle_user_message(session_id, user_content, round_number): if round_number < 2, each sage generates a followup — push each response to SSE using push_event(session_id, 'sage_token', ...) token by token (split response into words, push each word). After all sages respond, push sage_done events. If round_number == 2, each sage generates a verdict — push verdict events. Then trigger report generation."

Streaming simulation (until you add real streaming):
```python
# Fake token-by-token streaming from a full response string
for word in response_text.split():
    await push_event(session_id, "sage_token", {"sage_id": sage.sage_id, "token": word + " "})
    await asyncio.sleep(0.03)  # 30ms between words feels natural
```

---

## Hour 3:00–4:00 | Report Generator

**Codex prompt:**
> "Create /server/agents/report_generator.py. Async function generate_report(session_id, idea_text, all_verdicts, transcript) -> dict: calls Gemini Pro (gemini-1.5-pro or gemini-2.0-pro) with REPORT_PROMPT. Parses the JSON response strictly. Returns a dict matching the agreed report schema: survival_score (int), overall_verdict (str), sage_verdicts (list), top_risks (list of 3), top_improvements (list of 3), closest_parallel (dict), next_steps (list). If JSON parsing fails, return a safe fallback dict with survival_score=50 and placeholder strings. Store the report in a module-level dict keyed by session_id so GET /sessions/:id/report can retrieve it."

---

## Hour 4:00–5:00 | Prompt Iteration + Integration

This is your most important hour. Run actual sessions and fix the prompts.

Checklist:
- [ ] Each sage asks a genuinely different question (not generic "how will you grow?")
- [ ] Sage responses feel like they come from someone who lived through that failure
- [ ] Verdict rationale is specific to the user's idea, not generic
- [ ] Report survival score feels calibrated (not always 50 or 90)
- [ ] Report risks are specific, not "market risk" / "competition risk"

**Codex prompt for quick prompt iteration:**
> "Write a standalone Python script test_agents.py that takes a hardcoded idea ('AI meal planning app that auto-orders from Instacart'), runs researcher.run(), then runs all three sage opening messages, then prints them. No FastAPI, no SSE — just raw agent calls so I can iterate on prompts fast."

---

---

## TIMELINE OVERVIEW

```
          Dev A (Frontend)         Dev B (Backend)          Dev C (Agents)
0:00  ─── Scaffold React app  ──── Scaffold FastAPI  ──── Scaffold + seed JSON
0:30  ─── 4 screens structure ──── Core endpoints   ──── Researcher Agent
1:00  │                        ─── Stub endpoints   ──── Prompts.py
1:30  ─── Wire API calls       ─── SSE streaming    ──── Sage Agent class
2:00  │                        │                    ──── Orchestrator
2:30  ─── Polish + animations  ─── Integration test ──── Orchestrator cont.
3:00  │                        │                    ──── Report Generator
3:30  ─── Demo prep / fixes    ─── Fix SSE bugs     ──── Prompt iteration
4:00  ─── End-to-end test ──────────────────────────────── (all 3 together)
4:30  ─── Fix integration bugs ──────────────────────────────────────────
5:00  ─── DEMO ──────────────────────────────────────────────────────────
```

---

## COLLISION PREVENTION RULES

1. **Dev A never touches `/server`**. Dev B and C never touch `/client`.
2. **Dev B and C**: B owns root server files, C owns `/server/agents/`. The only shared thing is the `push_event` function — B writes it, C calls it. No co-editing.
3. **Stubs first**: Dev B returns hardcoded stubs from research/sage endpoints so Dev A can build against real HTTP immediately. Dev C replaces stubs with real agents as they're ready.
4. **API contract is frozen** after the first 15 minutes. Any change requires a group shout.
5. **Git**: feature branches. Dev A: `feat/frontend`. Dev B: `feat/backend-server`. Dev C: `feat/agents`. Merge to main only when a phase is complete.

---

## DEMO FLOW (memorize this)

1. Open the app on screen
2. Click "Try a demo idea" (pre-filled: AI meal planning app)
3. Hit "Face the Council" — show the "Summoning..." loader
4. Three sage cards animate in with names and failed startup personas
5. First sage message streams in word by word
6. Type a response, hit Send — other two sages reply
7. Round 2 plays out
8. Verdicts animate in one by one (show the green/yellow/red badges)
9. Click "View Report" — show the score dial and full analysis
10. Point out: "This took 5 minutes. A pivot insight that could save 6 months."

**Always have the backup screen recording ready.**
