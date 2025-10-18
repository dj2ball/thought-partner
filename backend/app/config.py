import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    use_langchain: bool = os.getenv("USE_LANGCHAIN", "false").lower() == "true"

settings = Settings()

# Debug: Check if API key is loaded
if settings.openai_api_key:
    print(f"✅ OpenAI API key loaded (length: {len(settings.openai_api_key)})")
else:
    print("❌ OpenAI API key not found in environment variables")