import abc
import time
import httpx
from src.config import REQUEST_DELAY_SECONDS, USER_AGENT

class BaseScraper(abc.ABC):
    """Base class for all swimming data scrapers."""

    def __init__(self):
        self.client = httpx.Client(
            headers={"User-Agent": USER_AGENT},
            timeout=30.0,
            follow_redirects=True,
        )
        self._last_request_time = 0.0

    def _polite_delay(self):
        """Wait between requests to be respectful."""
        elapsed = time.time() - self._last_request_time
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(REQUEST_DELAY_SECONDS - elapsed)

    def fetch(self, url: str) -> str:
        """Fetch a URL with polite delays. Returns HTML content."""
        self._polite_delay()
        response = self.client.get(url)
        response.raise_for_status()
        self._last_request_time = time.time()
        return response.text

    @abc.abstractmethod
    def scrape_meet(self, meet_url: str) -> dict:
        """Scrape a full meet. Returns structured data."""
        ...

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
