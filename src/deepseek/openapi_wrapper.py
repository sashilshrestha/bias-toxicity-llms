import os
import requests
import time
import json
from dotenv import load_dotenv

load_dotenv()

class DeepSeekOpenRouterWrapper:
    def __init__(self, api_key=None, model_name=None, temperature=0.7, max_tokens=512, retries=5, backoff=5):
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_key or os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "http://localhost"),
            "X-Title": os.getenv("OPENROUTER_SITE_NAME", "DeepSeekTest"),
        }
        self.model_name = model_name or os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-r1-distill-llama-70b:free")
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.retries = retries
        self.backoff = backoff  # seconds to wait between retries

    def generate(self, prompt):
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }

        for attempt in range(1, self.retries + 1):
            try:
                response = requests.post(self.api_url, headers=self.headers, data=json.dumps(payload), timeout=60)
            except requests.exceptions.RequestException as e:
                print(f"[Error] Network error: {e}")
                time.sleep(self.backoff)
                continue

            if response.status_code == 200:
                data = response.json()
                try:
                    return data["choices"][0]["message"]["content"]
                except (KeyError, IndexError):
                    print("[Error] Unexpected response format:", json.dumps(data, indent=2))
                    return None

            elif response.status_code in (429, 503):  # rate limit or model loading
                wait = self.backoff * attempt
                print(f"[Retry {attempt}/{self.retries}] Model loading or rate limited (status {response.status_code}). Retrying in {wait} sec...")
                time.sleep(wait)
            else:
                print(f"[Error] Status {response.status_code}: {response.text}")
                time.sleep(self.backoff)

        print("[Error] Max retries reached. Returning None.")
        return None
