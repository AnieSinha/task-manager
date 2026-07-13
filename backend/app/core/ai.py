"""
Thin wrapper around an LLM provider (Groq — free tier, OpenAI-compatible API)
for the AI-assisted features (project summary, roadmap generation).

Design goal: these features must work — with a sensible, clearly-labelled
fallback — even if no GROQ_API_KEY is configured. This keeps the UI fully
demoable without requiring a key, and becomes "real" the moment a key is
added, with zero code changes needed on either side.

Groq's free tier requires no credit card and no ongoing payment — see
https://console.groq.com/keys to generate a key.
"""

import json
import os

import httpx

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def is_ai_configured() -> bool:
    return bool(GROQ_API_KEY)


class AIError(Exception):
    """Raised when a configured AI provider call fails."""


def call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
    """
    Call the Groq chat-completions API (OpenAI-compatible) and return the
    text response. Raises AIError on any failure. Callers should have
    already checked is_ai_configured() and have a fallback ready.
    """
    try:
        resp = httpx.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "content-type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "max_tokens": max_tokens,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:  # noqa: BLE001 — deliberately broad, we always fall back
        raise AIError(str(exc)) from exc


def extract_json(text: str) -> dict:
    """LLMs sometimes wrap JSON in markdown fences — strip those before parsing."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned.strip())
