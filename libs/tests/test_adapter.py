"""Tests cho LLM adapter (mock SDK, không gọi API thật)."""

from unittest.mock import MagicMock, patch

from libs.llm.adapter import AnthropicClient, OpenAIClient, get_llm_client


@patch("anthropic.Anthropic")
def test_anthropic_complete(mock_anthropic):
    block = MagicMock(text="cv-json")
    mock_anthropic.return_value.messages.create.return_value = MagicMock(
        content=[block]
    )

    client = AnthropicClient(api_key="k", model="claude-opus-4-8")
    assert client.complete("sys", "hi") == "cv-json"


@patch("openai.OpenAI")
def test_openai_complete(mock_openai):
    choice = MagicMock()
    choice.message.content = "cv-json"
    mock_openai.return_value.chat.completions.create.return_value = MagicMock(
        choices=[choice]
    )

    client = OpenAIClient(api_key="k", model="gpt-4o")
    assert client.complete("sys", "hi") == "cv-json"


def test_factory_selects_by_provider():
    with patch("libs.common.config.settings") as s:
        s.llm_provider = "openai"
        s.openai_api_key = "k"
        s.llm_model = "gpt-4o"
        assert isinstance(get_llm_client(), OpenAIClient)

        s.llm_provider = "anthropic"
        s.anthropic_api_key = "k"
        assert isinstance(get_llm_client(), AnthropicClient)
