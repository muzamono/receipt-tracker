import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

# 1. Explicitly load the .env file from root directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print(f"Error: GEMINI_API_KEY not found in {env_path}")
    print("Please ensure your .env file contains: GEMINI_API_KEY=your_key_here")
    exit(1)

print(f"Loaded API Key: {api_key[:6]}...{api_key[-4:]}")

# 2. Pass api_key explicitly to client
client = genai.Client(api_key=api_key)

print("\n--- Available Flash Models for your API Key ---")
try:
    models = [m.name for m in client.models.list() if "flash" in m.name]
    for model in models:
        print(f"- {model}")
except Exception as e:
    print(f"Failed to fetch models: {e}")