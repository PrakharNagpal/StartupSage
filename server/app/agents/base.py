from abc import ABC, abstractmethod
from typing import Any


class Agent(ABC):
    name: str

    @abstractmethod
    async def run(self, input_text: str, context: dict[str, Any] | None = None) -> str:
        """Run an agent turn and return the generated text."""
