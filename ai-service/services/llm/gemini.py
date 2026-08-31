import os
import re
import time
import logging

from google import genai
# pyrefly: ignore [missing-import]
from google.genai.errors import ClientError

logger = logging.getLogger(__name__)

class GeminiProvider:
    _keys = None
    _current_index = 0

    def __init__(self):
        if GeminiProvider._keys is None:
            keys_str = os.getenv("GEMINI_API_KEYS") or os.getenv("GEMINI_API_KEY")
            
            if not keys_str:
                raise ValueError("GEMINI_API_KEYS is not configured")

            raw_keys = [k.strip() for k in keys_str.split(",") if k.strip()]
            
            if not raw_keys:
                raise ValueError("No valid API keys found in GEMINI_API_KEYS")
                
            GeminiProvider._keys = []
            for i, key in enumerate(raw_keys):
                GeminiProvider._keys.append({
                    "index": i + 1,
                    "key": key,
                    "client": genai.Client(api_key=key),
                    "available_at": 0.0
                })
                
            GeminiProvider._current_index = 0

    def _get_next_client(self):
        now = time.time()
        
        for _ in range(len(GeminiProvider._keys)):
            k = GeminiProvider._keys[GeminiProvider._current_index]
            GeminiProvider._current_index = (GeminiProvider._current_index + 1) % len(GeminiProvider._keys)
            if k["available_at"] <= now:
                return k
                
        # All keys are currently exhausted
        soonest = min(GeminiProvider._keys, key=lambda x: x["available_at"])
        wait_time = max(1.0, soonest["available_at"] - now)
        raise RuntimeError(f"All Gemini API keys are currently exhausted. Please retry in {int(wait_time)} seconds.")

    def _handle_client_error(self, exc: ClientError, key_info: dict):
        if exc.code == 429:
            # Try to parse the retry delay
            error_str = str(exc)
            delay = 60.0  # default fallback
            
            # Match formats like 'retry in 17s', 'retry in 17.2s', 'retryDelay': '17s'
            match = re.search(r'(?:retry(?:Delay\':\s*\')?|retry in\s*)(\d+(?:\.\d+)?)(?:s|\')', error_str)
            if match:
                delay = float(match.group(1))
                
            logger.warning(f"Gemini API 429 Resource Exhausted. Key will be skipped for {delay} seconds. Error: {error_str}")
            key_info["available_at"] = time.time() + delay
        else:
            raise RuntimeError(
                f"Gemini API request failed: {exc}. Verify API key access and project permissions."
            ) from exc

    async def generate(self, prompt: str) -> str:
        for _ in range(len(GeminiProvider._keys)):
            key_info = self._get_next_client()
            logger.info(f"Using Gemini API Key {key_info['index']} for generation")
            try:
                response = await key_info["client"].aio.models.generate_content(
                    model="gemini-flash-latest",
                    contents=prompt,
                )
                return response.text
            except ClientError as exc:
                self._handle_client_error(exc, key_info)
                
        # If we exhausted all keys during this single call loop
        soonest = min(GeminiProvider._keys, key=lambda x: x["available_at"])
        wait_time = max(1.0, soonest["available_at"] - time.time())
        raise RuntimeError(f"All Gemini API keys are currently exhausted. Please retry in {int(wait_time)} seconds.")

    async def generate_json(self, prompt: str) -> str:
        for _ in range(len(GeminiProvider._keys)):
            key_info = self._get_next_client()
            logger.info(f"Using Gemini API Key {key_info['index']} for json generation")
            try:
                response = await key_info["client"].aio.models.generate_content(
                    model="gemini-flash-latest",
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                    },
                )
                
                text = response.text.strip()
                # Strip markdown fences if present
                if text.startswith("```"):
                    text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                    if text.endswith("```"):
                        text = text[:-3].strip()
                return text
                
            except ClientError as exc:
                self._handle_client_error(exc, key_info)

        # If we exhausted all keys during this single call loop
        soonest = min(GeminiProvider._keys, key=lambda x: x["available_at"])
        wait_time = max(1.0, soonest["available_at"] - time.time())
        raise RuntimeError(f"All Gemini API keys are currently exhausted. Please retry in {int(wait_time)} seconds.")
