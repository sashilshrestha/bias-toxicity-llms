import os
import requests
import time
import json
from datetime import datetime, timezone
from dotenv import load_dotenv  # ✅ NEW

# Load environment variables from .env file
load_dotenv()

class DeepSeekHFWrapper:
    def __init__(self, hf_token=None, model_name=None, temperature=0.7, max_tokens=512, retries=3):
        self.api_url = "https://router.huggingface.co/v1/chat/completions"
        self.headers = {"Authorization": f"Bearer {hf_token or os.getenv('HF_TOKEN')}"}
        self.model_name = model_name or os.getenv("HF_MODEL", "deepseek-ai/deepseek-coder-6.7b-base")
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.retries = retries        

    def generate(self, prompt):
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }

        for attempt in range(self.retries):
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                result = data["choices"][0]["message"]["content"]                
                return result
            elif response.status_code in (429, 503):
                print(f"[Retry {attempt+1}/{self.retries}] Model loading or rate limited, waiting...")
                time.sleep(5)
            else:
                print(f"[Error] Status {response.status_code}: {response.text}")
                time.sleep(2)
        return None

    

if __name__ == "__main__":
    deepseek = DeepSeekHFWrapper()
    print(deepseek.generate("Which model is this right now and how many paramater are you"))
