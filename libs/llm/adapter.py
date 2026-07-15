"""LLM adapter: cho phép đổi giữa Claude (Anthropic) và OpenAI qua config.

TODO: cài đặt gọi API thực tế. Đây là skeleton định nghĩa interface chung.
"""

from abc import ABC, abstractmethod


class LLMClient(ABC):
    @abstractmethod
    def complete(self, system: str, prompt: str, **kwargs) -> str:
        """Sinh text từ system prompt + user prompt."""
        ...


class AnthropicClient(LLMClient):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def complete(self, system: str, prompt: str, **kwargs) -> str:
        # TODO: from anthropic import Anthropic; client.messages.create(...)
        raise NotImplementedError


class OpenAIClient(LLMClient):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def complete(self, system: str, prompt: str, **kwargs) -> str:
        # TODO: from openai import OpenAI; client.chat.completions.create(...)
        raise NotImplementedError


def get_llm_client() -> LLMClient:
    """Trả về client phù hợp dựa trên settings."""
    from libs.common.config import settings

    if settings.llm_provider == "openai":
        return OpenAIClient(settings.openai_api_key, settings.llm_model)
    return AnthropicClient(settings.anthropic_api_key, settings.llm_model)
