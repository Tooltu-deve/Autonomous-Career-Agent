"""LLM adapter: đổi giữa Claude (Anthropic) và OpenAI qua config."""

from abc import ABC, abstractmethod

DEFAULT_MAX_TOKENS = 4096


class LLMClient(ABC):
    """Interface chung cho mọi LLM provider."""

    @abstractmethod
    def complete(self, system: str, prompt: str, **kwargs) -> str:
        """Sinh text từ system prompt + user prompt."""
        ...


class AnthropicClient(LLMClient):
    """Client gọi Claude qua SDK `anthropic`."""

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def complete(self, system: str, prompt: str, **kwargs) -> str:
        from anthropic import Anthropic

        client = Anthropic(api_key=self.api_key)
        response = client.messages.create(
            model=self.model,
            system=system,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.pop("max_tokens", DEFAULT_MAX_TOKENS),
            **kwargs,
        )
        return response.content[0].text


class OpenAIClient(LLMClient):
    """Client gọi OpenAI qua SDK `openai`."""

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def complete(self, system: str, prompt: str, **kwargs) -> str:
        from openai import OpenAI

        client = OpenAI(api_key=self.api_key)
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            **kwargs,
        )
        return response.choices[0].message.content


def get_llm_client() -> LLMClient:
    """Trả về client phù hợp dựa trên settings."""
    from libs.common.config import settings

    if settings.llm_provider == "openai":
        return OpenAIClient(settings.openai_api_key, settings.llm_model)
    return AnthropicClient(settings.anthropic_api_key, settings.llm_model)
