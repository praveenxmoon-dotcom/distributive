"""Modular LLM provider interface.

Supports two provider types:
- "ollama": Local Ollama server (NOT accessible from cloud-hosted apps)
- "openai": Any OpenAI-compatible endpoint (OpenAI, Azure, vLLM, OpenRouter, etc.)

When no provider is configured (provider="none"), all LLM calls gracefully
degrade to deterministic fallback explanations. The Decision Engine works
fully without an LLM.

Business calculations and hard constraints always remain in backend code.
LLM output is treated as untrusted — it is never used for scoring, recovery
generation, or business rule enforcement.
"""
from __future__ import annotations

import logging
from typing import Protocol

import httpx

from ..config import Settings, get_settings

logger = logging.getLogger(__name__)


class LLMProvider(Protocol):
    """Protocol that all LLM providers implement."""

    @property
    def available(self) -> bool: ...

    def complete(self, system_prompt: str, user_prompt: str) -> str: ...


class NoOpProvider:
    """Default provider when no LLM is configured. Returns empty strings."""

    @property
    def available(self) -> bool:
        return False

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        return ""


class OllamaProvider:
    """Provider for a local Ollama server.

    Configuration:
      LLM_PROVIDER=ollama
      LLM_OLLAMA_BASE_URL=http://localhost:11434
      LLM_OLLAMA_MODEL=llama3.1

    Requires a running Ollama server on the same machine or reachable network.
    Cloud-hosted applications cannot reach a localhost Ollama instance.
    """

    def __init__(self, base_url: str, model: str, timeout: int = 30):
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = timeout

    @property
    def available(self) -> bool:
        try:
            r = httpx.get(
                f"{self._base_url}/api/tags",
                timeout=5,
            )
            return r.status_code == 200
        except Exception:
            logger.warning("Ollama server not reachable at %s", self._base_url)
            return False

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        try:
            r = httpx.post(
                f"{self._base_url}/api/generate",
                json={
                    "model": self._model,
                    "prompt": full_prompt,
                    "stream": False,
                },
                timeout=self._timeout,
            )
            r.raise_for_status()
            data = r.json()
            return data.get("response", "").strip()
        except Exception as e:
            logger.error("Ollama completion failed: %s", e)
            return ""


class OpenAICompatibleProvider:
    """Provider for any OpenAI-compatible chat completions endpoint.

    Configuration:
      LLM_PROVIDER=openai
      LLM_OPENAI_BASE_URL=https://api.openai.com/v1
      LLM_OPENAI_API_KEY=sk-...
      LLM_OPENAI_MODEL=gpt-4o-mini

    Works with OpenAI, Azure OpenAI (with adjusted base URL), LM Studio,
    vLLM, OpenRouter, and other compatible servers.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str,
        timeout: int = 30,
        max_tokens: int = 1024,
        temperature: float = 0.3,
    ):
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._model = model
        self._timeout = timeout
        self._max_tokens = max_tokens
        self._temperature = temperature

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        try:
            r = httpx.post(
                f"{self._base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self._model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": self._max_tokens,
                    "temperature": self._temperature,
                },
                timeout=self._timeout,
            )
            r.raise_for_status()
            data = r.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
            return ""
        except Exception as e:
            logger.error("OpenAI-compatible completion failed: %s", e)
            return ""


def create_provider(settings: Settings | None = None) -> LLMProvider:
    """Factory: create the configured LLM provider instance."""
    if settings is None:
        settings = get_settings()

    if settings.llm_provider == "ollama":
        return OllamaProvider(
            base_url=settings.llm_ollama_base_url,
            model=settings.llm_ollama_model,
            timeout=settings.llm_timeout,
        )
    elif settings.llm_provider == "openai":
        return OpenAICompatibleProvider(
            base_url=settings.llm_openai_base_url,
            api_key=settings.llm_openai_api_key,
            model=settings.llm_openai_model,
            timeout=settings.llm_timeout,
            max_tokens=settings.llm_max_tokens,
            temperature=settings.llm_temperature,
        )
    else:
        return NoOpProvider()
