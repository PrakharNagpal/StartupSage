from __future__ import annotations

from app.core.config import settings


async def smoke_test_gemini() -> dict[str, str | bool]:
    if not settings.gemini_api_key:
        return {"provider": "gemini", "configured": False, "message": "GEMINI_API_KEY is not set."}
    try:
        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Reply with only: StartupSage Gemini OK",
        )
        return {"provider": "gemini", "configured": True, "message": response.text or ""}
    except Exception as exc:
        return {"provider": "gemini", "configured": True, "message": f"Gemini error: {exc}"}


async def smoke_test_openai() -> dict[str, str | bool]:
    if not settings.openai_api_key:
        return {"provider": "openai", "configured": False, "message": "OPENAI_API_KEY is not set."}
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.responses.create(
            model="gpt-4o-mini",
            input="Reply with only: StartupSage OpenAI OK",
        )
        return {"provider": "openai", "configured": True, "message": response.output_text}
    except Exception as exc:
        return {"provider": "openai", "configured": True, "message": f"OpenAI error: {exc}"}
