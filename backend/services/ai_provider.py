"""
ai_provider.py
---------------
Unified two-tier async wrapper for Anthropic Claude (primary) and Groq Llama (fallback).

Controlled entirely by env vars — swap providers without a code change:
    AI_PRIMARY_PROVIDER   (claude | groq, default: claude)
    AI_FALLBACK_PROVIDER  (claude | groq, default: groq)
    AI_PRIMARY_MODEL      (default: claude-sonnet-4-5-20250929)
    AI_FALLBACK_MODEL     (default: llama-3.3-70b-versatile)
    ANTHROPIC_API_KEY
    GROQ_API_KEY

Fallback triggers: primary provider raises any exception, or its key is missing.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Literal, Optional

import anthropic
from groq import AsyncGroq

logger = logging.getLogger(__name__)

Provider = Literal["claude", "groq"]

DEFAULT_PRIMARY: Provider = "claude"
DEFAULT_FALLBACK: Provider = "groq"
DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5-20250929"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"


@dataclass
class AIResponse:
    text: str
    provider: Provider
    model: str
    fallback_used: bool = False


def _env(name: str, default: str) -> str:
    value = os.getenv(name)
    return value.strip() if value and value.strip() else default


def _provider_from_env(name: str, default: Provider) -> Provider:
    raw = _env(name, default).lower()
    if raw not in ("claude", "groq"):
        logger.warning("Invalid %s=%r, falling back to %s", name, raw, default)
        return default
    return raw  # type: ignore[return-value]


def _model_for(provider: Provider) -> str:
    if provider == "claude":
        return _env("AI_PRIMARY_MODEL", DEFAULT_CLAUDE_MODEL)
    return _env("AI_FALLBACK_MODEL", DEFAULT_GROQ_MODEL)


# Single shared client per provider. Lazy-init so missing keys don't block import.
_anthropic_client: Optional[anthropic.AsyncAnthropic] = None
_groq_client: Optional[AsyncGroq] = None


def _get_anthropic() -> Optional[anthropic.AsyncAnthropic]:
    global _anthropic_client
    if _anthropic_client is not None:
        return _anthropic_client
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return None
    _anthropic_client = anthropic.AsyncAnthropic(api_key=key)
    return _anthropic_client


def _get_groq() -> Optional[AsyncGroq]:
    global _groq_client
    if _groq_client is not None:
        return _groq_client
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return None
    _groq_client = AsyncGroq(api_key=key)
    return _groq_client


async def _call_claude(
    system: str,
    prompt: str,
    *,
    model: str,
    max_tokens: int,
    temperature: float,
) -> str:
    client = _get_anthropic()
    if client is None:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    message = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    for block in message.content or []:
        if getattr(block, "type", None) == "text":
            return (block.text or "").strip()
    return ""


async def _call_groq(
    system: str,
    prompt: str,
    *,
    model: str,
    max_tokens: int,
    temperature: float,
) -> str:
    client = _get_groq()
    if client is None:
        raise RuntimeError("GROQ_API_KEY is not set")
    completion = await client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    )
    choice = completion.choices[0] if completion.choices else None
    if choice is None or not choice.message or not choice.message.content:
        return ""
    return choice.message.content.strip()


async def _dispatch(
    provider: Provider,
    *,
    system: str,
    prompt: str,
    max_tokens: int,
    temperature: float,
) -> str:
    model = _model_for(provider)
    if provider == "claude":
        return await _call_claude(
            system, prompt, model=model, max_tokens=max_tokens, temperature=temperature
        )
    return await _call_groq(
        system, prompt, model=model, max_tokens=max_tokens, temperature=temperature
    )


async def generate(
    prompt: str,
    *,
    system: str = "You are a thoughtful research assistant. Be concise and accurate.",
    max_tokens: int = 1024,
    temperature: float = 0.3,
) -> AIResponse:
    """
    Generate text with primary provider, auto-falling back to secondary on any failure.
    Returns the text plus metadata about which provider served it.
    """
    primary = _provider_from_env("AI_PRIMARY_PROVIDER", DEFAULT_PRIMARY)
    fallback = _provider_from_env("AI_FALLBACK_PROVIDER", DEFAULT_FALLBACK)

    try:
        text = await _dispatch(
            primary,
            system=system,
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return AIResponse(
            text=text, provider=primary, model=_model_for(primary), fallback_used=False
        )
    except Exception as primary_err:  # fall through to fallback
        logger.warning("Primary AI provider %s failed: %s", primary, primary_err)
        if fallback == primary:
            raise
        try:
            text = await _dispatch(
                fallback,
                system=system,
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return AIResponse(
                text=text,
                provider=fallback,
                model=_model_for(fallback),
                fallback_used=True,
            )
        except Exception as fallback_err:
            logger.error("Fallback AI provider %s also failed: %s", fallback, fallback_err)
            raise


def provider_status() -> dict:
    """Health snapshot — which providers have keys available."""
    return {
        "primary": _provider_from_env("AI_PRIMARY_PROVIDER", DEFAULT_PRIMARY),
        "fallback": _provider_from_env("AI_FALLBACK_PROVIDER", DEFAULT_FALLBACK),
        "claude_available": bool(os.getenv("ANTHROPIC_API_KEY")),
        "groq_available": bool(os.getenv("GROQ_API_KEY")),
        "primary_model": _env("AI_PRIMARY_MODEL", DEFAULT_CLAUDE_MODEL),
        "fallback_model": _env("AI_FALLBACK_MODEL", DEFAULT_GROQ_MODEL),
    }
