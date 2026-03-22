"""Supabase client setup and connection testing."""

from supabase import create_client, Client

from src.config import SUPABASE_URL, SUPABASE_KEY


def get_client() -> Client:
    """Create and return a Supabase client."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def test_connection() -> bool:
    """Test the connection by querying the scrape_log table.

    Returns True if the query succeeds, False otherwise.
    """
    try:
        client = get_client()
        client.table("scrape_log").select("id").limit(1).execute()
        return True
    except Exception:
        return False
