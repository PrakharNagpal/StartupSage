from typing import Any

from app.agents.base import Agent


class EchoAgent(Agent):
    name = "echo"

    async def run(self, input_text: str, context: dict[str, Any] | None = None) -> str:
        idea = input_text.strip()
        if context and context.get("sage"):
            return f"{context['sage']} heard the pitch and asks: what evidence proves this will work?"
        return f"Echo baseline received: {idea}"
