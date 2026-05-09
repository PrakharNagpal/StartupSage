# StartupSage API Contract

Base URL: `http://127.0.0.1:8000`

## Health

`GET /health`

Response:

```json
{ "status": "ok", "service": "startupsage-api" }
```

## Create Session

`POST /sessions`

Request:

```json
{ "idea": "An AI bookkeeping copilot for solo founders..." }
```

Response:

```json
{
  "session_id": "uuid",
  "status": "created",
  "sages": [
    {
      "key": "distribution",
      "archetype": "The Distribution Skeptic",
      "startup_name": "Quibi",
      "sector": "Streaming Media",
      "failure_lens": "Misread consumer behavior...",
      "avatar_color": "#7b68ee"
    }
  ]
}
```

## Messages

`GET /sessions/{session_id}/messages`

Returns ordered system, user, and sage messages.

`POST /sessions/{session_id}/messages`

Request:

```json
{ "content": "We will start with indie agencies and charge per reconciled account." }
```

## Live Session Stream

`GET /sessions/{session_id}/stream`

Server-Sent Events:

```text
event: token
data: {"sage_key":"distribution","sage_name":"The Distribution Skeptic","token":"Your "}

event: message_done
data: {"sage_key":"distribution","sage_name":"The Distribution Skeptic"}

event: done
data: {"session_id":"uuid"}
```

## Report

`GET /sessions/{session_id}/report`

Response:

```json
{
  "session_id": "uuid",
  "score": 62,
  "markdown": "# StartupSage Baseline Report\n..."
}
```

## LLM Smoke Tests

`GET /llm/smoke?provider=gemini`

`GET /llm/smoke?provider=openai`

If the corresponding API key is missing, the endpoint returns `configured: false` instead of failing.
