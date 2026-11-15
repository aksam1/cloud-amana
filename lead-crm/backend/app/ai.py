"""The one place that talks to Claude.

Both uses (scoring a website, sorting a reply) ask for a small JSON answer.
If there is no ANTHROPIC_API_KEY, or the call fails, this returns None and the
caller falls back to a simple built-in rule, so the app still works.
"""
import json
import logging

from .config import env

log = logging.getLogger("leadcrm.ai")


def ask_json(system: str, user: str, schema: dict) -> dict | None:
    key = env().anthropic_api_key
    if not key:
        return None
    import anthropic

    client = anthropic.Anthropic(api_key=key, timeout=90.0, max_retries=2)
    try:
        response = client.messages.create(
            model=env().claude_model,
            max_tokens=16000,
            system=system,
            messages=[{"role": "user", "content": user}],
            # Low effort keeps these small jobs quick and cheap; the schema
            # guarantees the answer is valid JSON in the shape we asked for.
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": schema}},
        )
    except anthropic.AuthenticationError:
        log.error("Claude rejected the API key. Check ANTHROPIC_API_KEY in .env")
        return None
    except anthropic.RateLimitError:
        log.warning("Claude rate limit reached; using the built-in rule for this one")
        return None
    except anthropic.APIStatusError as error:
        log.error("Claude API error %s: %s", error.status_code, error.message)
        return None
    except anthropic.APIConnectionError:
        log.error("Could not reach the Claude API")
        return None

    if response.stop_reason != "end_turn":
        log.warning("Claude stopped early (%s); using the built-in rule", response.stop_reason)
        return None
    text = next((block.text for block in response.content if block.type == "text"), "")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        log.warning("Claude returned something that was not JSON")
        return None


def is_configured() -> bool:
    return bool(env().anthropic_api_key)
