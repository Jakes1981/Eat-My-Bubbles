"""Application configuration loaded from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root
_project_root = Path(__file__).parent.parent
load_dotenv(_project_root / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Scraping settings
REQUEST_DELAY_SECONDS = 2.5
USER_AGENT = "NoaSwimming/0.1 (competitive swimming data research)"
