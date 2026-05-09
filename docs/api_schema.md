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

## Voice Transcription

`POST /sessions/{session_id}/transcribe`

Request: multipart form-data with one `audio` file field.

Response:

```json
{ "text": "We will start with indie agencies and charge per reconciled account." }
```

## Judge Audio

Generated judge response audio is served from `/audio/{session_id}/{message_id}.mp3`.

## Live Session Stream

`GET /sessions/{session_id}/stream`

Server-Sent Events:

```text
event: sage_token
data: {"message_id":"sage-uuid","sage_id":"sage_1","sage_name":"The Distribution Skeptic","token":"Your "}

event: sage_audio
data: {"message_id":"sage-uuid","sage_id":"sage_1","sage_name":"The Distribution Skeptic","audio_url":"/audio/session/sage-uuid.mp3","voice":"marin","format":"mp3"}

event: sage_done
data: {"message_id":"sage-uuid","sage_id":"sage_1","sage_name":"The Distribution Skeptic"}

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
