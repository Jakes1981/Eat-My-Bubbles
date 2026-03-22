"""Tests for the Hy-Tek web scraper using fixture files."""

from pathlib import Path

import pytest

from src.scrapers.hytek_web import HyTekWebScraper, _extract_links, _is_event_link


_FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def scraper():
    """Create a scraper instance (no network calls in these tests)."""
    s = HyTekWebScraper()
    yield s
    s.close()


@pytest.fixture
def event1_html() -> str:
    return (_FIXTURES_DIR / "sample_hytek_event1.html").read_text()


@pytest.fixture
def event2_html() -> str:
    return (_FIXTURES_DIR / "sample_hytek_event2.html").read_text()


@pytest.fixture
def index_html() -> str:
    return (_FIXTURES_DIR / "sample_hytek_index.html").read_text()


@pytest.fixture
def parsed_event1(scraper, event1_html):
    return scraper.parse_event_page(event1_html)


@pytest.fixture
def parsed_event2(scraper, event2_html):
    return scraper.parse_event_page(event2_html)


# ═══════════════════════════════════════════════════════════════════════════
# Event parsing
# ═══════════════════════════════════════════════════════════════════════════

class TestEventParsing:
    def test_event_1_number(self, parsed_event1):
        assert parsed_event1["event_number"] == 1

    def test_event_1_distance(self, parsed_event1):
        assert parsed_event1["distance"] == 100

    def test_event_1_stroke(self, parsed_event1):
        assert parsed_event1["stroke"] == "Freestyle"

    def test_event_1_gender(self, parsed_event1):
        assert parsed_event1["gender"] == "M"

    def test_event_1_age_group(self, parsed_event1):
        assert parsed_event1["age_group"] == "11-12"

    def test_event_2_stroke(self, parsed_event2):
        assert parsed_event2["stroke"] == "IM"

    def test_event_2_gender(self, parsed_event2):
        assert parsed_event2["gender"] == "F"


# ═══════════════════════════════════════════════════════════════════════════
# Result parsing
# ═══════════════════════════════════════════════════════════════════════════

class TestResultParsing:
    def test_event_1_result_count(self, parsed_event1):
        assert len(parsed_event1["results"]) == 4

    def test_event_2_result_count(self, parsed_event2):
        assert len(parsed_event2["results"]) == 2

    def test_first_place_name(self, parsed_event1):
        r1 = parsed_event1["results"][0]
        assert r1["name"] == "Burger, Noa"

    def test_first_place_age(self, parsed_event1):
        r1 = parsed_event1["results"][0]
        assert r1["age"] == 11

    def test_first_place_team(self, parsed_event1):
        r1 = parsed_event1["results"][0]
        assert r1["team"] == "UCSC-AB"

    def test_first_place_time_text(self, parsed_event1):
        r1 = parsed_event1["results"][0]
        assert r1["time_text"] == "1:02.34"

    def test_first_place_time_seconds(self, parsed_event1):
        r1 = parsed_event1["results"][0]
        assert r1["time_seconds"] == pytest.approx(62.34)

    def test_first_place_place(self, parsed_event1):
        r1 = parsed_event1["results"][0]
        assert r1["place"] == 1

    def test_second_place(self, parsed_event1):
        r2 = parsed_event1["results"][1]
        assert r2["name"] == "Smith, James"
        assert r2["time_seconds"] == pytest.approx(64.56)
        assert r2["place"] == 2


# ═══════════════════════════════════════════════════════════════════════════
# DQ handling
# ═══════════════════════════════════════════════════════════════════════════

class TestDQHandling:
    def test_dq_status(self, parsed_event1):
        dq_result = parsed_event1["results"][3]
        assert dq_result["status"] == "DQ"

    def test_dq_time_is_none(self, parsed_event1):
        dq_result = parsed_event1["results"][3]
        assert dq_result["time_seconds"] is None

    def test_dq_name(self, parsed_event1):
        dq_result = parsed_event1["results"][3]
        assert dq_result["name"] == "Williams, Max"


# ═══════════════════════════════════════════════════════════════════════════
# Split parsing
# ═══════════════════════════════════════════════════════════════════════════

class TestSplitParsing:
    def test_event_1_first_result_has_splits(self, parsed_event1):
        r1 = parsed_event1["results"][0]
        assert "splits" in r1
        assert len(r1["splits"]) == 2

    def test_split_cumulative_values(self, parsed_event1):
        r1 = parsed_event1["results"][0]
        splits = r1["splits"]
        assert splits[0]["cumulative_seconds"] == pytest.approx(32.10)
        assert splits[1]["cumulative_seconds"] == pytest.approx(62.34)

    def test_split_individual_values(self, parsed_event1):
        r1 = parsed_event1["results"][0]
        splits = r1["splits"]
        assert splits[0]["split_seconds"] == pytest.approx(32.10)
        assert splits[1]["split_seconds"] == pytest.approx(30.24)

    def test_event_2_has_four_splits(self, parsed_event2):
        r1 = parsed_event2["results"][0]
        assert "splits" in r1
        assert len(r1["splits"]) == 4

    def test_dq_has_no_splits(self, parsed_event1):
        dq = parsed_event1["results"][3]
        assert dq.get("splits", []) == []


# ═══════════════════════════════════════════════════════════════════════════
# Index page parsing
# ═══════════════════════════════════════════════════════════════════════════

class TestIndexParsing:
    def test_finds_event_links(self, index_html):
        links = _extract_links(index_html)
        event_links = [l for l in links if _is_event_link(l["href"], l["text"])]
        assert len(event_links) == 2

    def test_link_hrefs(self, index_html):
        links = _extract_links(index_html)
        event_links = [l for l in links if _is_event_link(l["href"], l["text"])]
        assert event_links[0]["href"] == "event001.htm"
        assert event_links[1]["href"] == "event002.htm"

    def test_link_text(self, index_html):
        links = _extract_links(index_html)
        event_links = [l for l in links if _is_event_link(l["href"], l["text"])]
        assert "100 Freestyle" in event_links[0]["text"]
        assert "Individual Medley" in event_links[1]["text"]
