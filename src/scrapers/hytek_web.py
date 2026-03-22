"""Hy-Tek Meet Manager web results scraper.

Hy-Tek publishes meet results as static HTML pages, typically with:
- An index page linking to individual event result pages
- Event pages containing results in <pre> tags with fixed-width formatting

This scraper discovers event links from the index, fetches each event page,
and parses the fixed-width result lines into structured data.  It uses only
the standard library for HTML parsing (no BeautifulSoup dependency).
"""

from __future__ import annotations

import re
from html.parser import HTMLParser
from urllib.parse import urljoin

from src.scrapers.base import BaseScraper
from src.processors.times import parse_time
from src.processors.events import parse_event_description, normalize_stroke


# ---------------------------------------------------------------------------
# HTML helpers (stdlib HTMLParser, no BeautifulSoup)
# ---------------------------------------------------------------------------

class _LinkExtractor(HTMLParser):
    """Extract all <a> tags with href attributes."""

    def __init__(self):
        super().__init__()
        self.links: list[dict[str, str]] = []
        self._current_href: str | None = None
        self._current_text_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        if tag == "a":
            attr_dict = dict(attrs)
            href = attr_dict.get("href")
            if href:
                self._current_href = href
                self._current_text_parts = []

    def handle_data(self, data: str):
        if self._current_href is not None:
            self._current_text_parts.append(data)

    def handle_endtag(self, tag: str):
        if tag == "a" and self._current_href is not None:
            text = " ".join("".join(self._current_text_parts).split())
            self.links.append({"href": self._current_href, "text": text})
            self._current_href = None
            self._current_text_parts = []


class _PreExtractor(HTMLParser):
    """Extract text content from all <pre> tags."""

    def __init__(self):
        super().__init__()
        self.pre_blocks: list[str] = []
        self._in_pre = False
        self._current_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        if tag == "pre":
            self._in_pre = True
            self._current_parts = []

    def handle_data(self, data: str):
        if self._in_pre:
            self._current_parts.append(data)

    def handle_endtag(self, tag: str):
        if tag == "pre" and self._in_pre:
            self.pre_blocks.append("".join(self._current_parts))
            self._in_pre = False
            self._current_parts = []


class _TitleExtractor(HTMLParser):
    """Extract the <title> content from an HTML document."""

    def __init__(self):
        super().__init__()
        self.title: str = ""
        self._in_title = False

    def handle_starttag(self, tag: str, attrs):
        if tag == "title":
            self._in_title = True

    def handle_data(self, data: str):
        if self._in_title:
            self.title += data

    def handle_endtag(self, tag: str):
        if tag == "title":
            self._in_title = False


def _extract_links(html: str) -> list[dict[str, str]]:
    """Return all links as [{"href": ..., "text": ...}, ...]."""
    parser = _LinkExtractor()
    parser.feed(html)
    return parser.links


def _extract_pre_blocks(html: str) -> list[str]:
    """Return text content of all <pre> tags."""
    parser = _PreExtractor()
    parser.feed(html)
    return parser.pre_blocks


def _extract_title(html: str) -> str:
    """Return the <title> content, or empty string."""
    parser = _TitleExtractor()
    parser.feed(html)
    return parser.title.strip()


# ---------------------------------------------------------------------------
# Regex patterns for Hy-Tek fixed-width result lines
# ---------------------------------------------------------------------------

# Main result line.  Examples:
#   " 1 Burger, Noa              11 CLUB-AB       1:02.34"
#   " 1 Millns, Zac      17 CRKW                52.09      52.16 T10"
#   "   --- Smith, John          12 TEAM-SK         DQ"
#   " -- Brown, Brayden   17 CRKW                  DQ"
#   "   x2 Doe, Jane             10 SWIM-AB       35.40"
_RESULT_LINE_RE = re.compile(
    r"^\s*"
    r"(?:"
        r"(?P<place>\d{1,3})"           # numeric place
        r"|(?:--[-]?)"                   # DQ / NS / SCR marker (-- or ---)
        r"|(?:x(?P<exhibition>\d+))"     # exhibition swim
    r")"
    r"\s+"
    r"(?P<name>[A-Za-z'-]+,\s*[A-Za-z' .\-]+?)"   # "Last, First"
    r"\s+"
    r"(?P<age>\d{1,3})"                 # age
    r"\s+"
    r"(?P<team>[A-Za-z0-9][\w ]*(?:-[A-Z]{2})?)"  # team code, e.g. CRKW, MH Waves, CLUB-AB
    r"\s+"
    r"(?P<time_text>"
        r"(?:\d{1,2}:)?\d{1,2}\.\d{2}"  # numeric time
        r"|DQ|NS|SCR|NT|DNF|DSQ"         # status codes
    r")"
    r"(?:\s+.*)?$"                       # optional trailing data (prelim time, qualifiers)
)

# Fallback for formats where age is absent.
_RESULT_LINE_NO_AGE_RE = re.compile(
    r"^\s*"
    r"(?:"
        r"(?P<place>\d{1,3})"
        r"|(?:--[-]?)"
        r"|(?:x(?P<exhibition>\d+))"
    r")"
    r"\s+"
    r"(?P<name>[A-Za-z'-]+,\s*[A-Za-z' .\-]+?)"
    r"\s+"
    r"(?P<team>[A-Za-z0-9][\w ]*(?:-[A-Z]{2})?)"
    r"\s+"
    r"(?P<time_text>"
        r"(?:\d{1,2}:)?\d{1,2}\.\d{2}"
        r"|DQ|NS|SCR|NT|DNF|DSQ"
    r")"
    r"(?:\s+.*)?$"
)

# Matches any swim-time value (used to extract splits).
_TIME_VALUE_RE = re.compile(r"(?:\d{1,2}:)?\d{1,2}\.\d{2}")

# Event header inside <pre> blocks.
#   "Event 1  Boys 11-12 100 Freestyle"
_EVENT_HEADER_RE = re.compile(
    r"Event\s+(?P<event_number>\d+)\s+(?P<description>.+)",
    re.IGNORECASE,
)

# Round / heat headers.
_ROUND_RE = re.compile(
    r"\b(Prelims|Finals|Semifinals|Semi-Finals|Timed Finals|"
    r"Consolation|Bonus)\b",
    re.IGNORECASE,
)
_HEAT_RE = re.compile(r"Heat\s+(\d+)\s+of\s+\d+", re.IGNORECASE)

# Relay detection.
_RELAY_RE = re.compile(r"\brelay\b", re.IGNORECASE)

# Meet-info patterns.
_MEET_NAME_RE = re.compile(r"^(.+?)\s*[-\u2014]\s*\d", re.MULTILINE)
_COURSE_RE = re.compile(
    r"\b(LCM|SCM|SCY|Long\s*Course\s*Met(?:re|er)s?|"
    r"Short\s*Course\s*Met(?:re|er)s?|Short\s*Course\s*Yards?)\b",
    re.IGNORECASE,
)

_COURSE_NORMALIZE: dict[str, str] = {
    "lcm": "LCM", "scm": "SCM", "scy": "SCY",
    "long course metres": "LCM", "long course meters": "LCM",
    "long course metre": "LCM", "long course meter": "LCM",
    "short course metres": "SCM", "short course meters": "SCM",
    "short course metre": "SCM", "short course meter": "SCM",
    "short course yards": "SCY", "short course yard": "SCY",
}

_DATE_RE = re.compile(
    r"(?P<month>\w+)\s+(?P<day>\d{1,2})(?:\s*[-\u2013]\s*\d{1,2})?,?\s*(?P<year>\d{4})"
    r"|(?P<iso>\d{4}-\d{2}-\d{2})"
    r"|(?P<us_month>\d{1,2})/(?P<us_day>\d{1,2})/(?P<us_year>\d{4})"
)

_MONTH_MAP: dict[str, str] = {
    "january": "01", "february": "02", "march": "03", "april": "04",
    "may": "05", "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12",
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "jun": "06", "jul": "07", "aug": "08", "sep": "09",
    "oct": "10", "nov": "11", "dec": "12",
}

_DQ_STATUSES = frozenset({"DQ", "NS", "SCR", "NT", "DNF", "DSQ"})


# ---------------------------------------------------------------------------
# Scraper
# ---------------------------------------------------------------------------

class HyTekWebScraper(BaseScraper):
    """Scraper for Hy-Tek Meet Manager web-published results."""

    def discover_events(self, meet_url: str) -> list[dict]:
        """Parse the index page to find event result page links.

        Args:
            meet_url: URL of the Hy-Tek meet index page.

        Returns:
            List of dicts with keys ``url`` (absolute) and ``event_name``.
        """
        html = self.fetch(meet_url)
        links = _extract_links(html)

        events: list[dict] = []
        seen_urls: set[str] = set()

        for link in links:
            href = link["href"]
            text = link["text"]

            if not _is_event_link(href, text):
                continue

            absolute_url = urljoin(meet_url, href)
            if absolute_url in seen_urls:
                continue
            seen_urls.add(absolute_url)

            events.append({"url": absolute_url, "event_name": text})

        return events

    def parse_event_page(self, html: str) -> dict:
        """Parse a single Hy-Tek event results page.

        Args:
            html: Raw HTML of the event page.

        Returns:
            Dict with event metadata and a ``results`` list.
        """
        pre_blocks = _extract_pre_blocks(html)
        title = _extract_title(html)

        full_text = "\n".join(pre_blocks) if pre_blocks else html

        # Event header.
        event_info = _parse_event_header(full_text, title)

        # Round.
        round_match = _ROUND_RE.search(full_text)
        event_round = round_match.group(1).title() if round_match else "Finals"

        # Parse lines.
        current_heat: int | None = None
        results: list[dict] = []
        lines = full_text.splitlines()

        i = 0
        while i < len(lines):
            line = lines[i]

            # Heat header.
            heat_match = _HEAT_RE.search(line)
            if heat_match:
                current_heat = int(heat_match.group(1))
                i += 1
                continue

            # Result line.
            result = _parse_result_line(line)
            if result is not None:
                if current_heat is not None:
                    result["heat"] = current_heat

                # Look ahead for split lines.
                splits: list[float] = []
                j = i + 1
                while j < len(lines):
                    next_line = lines[j]
                    if (
                        next_line.startswith("    ")
                        and _TIME_VALUE_RE.search(next_line)
                        and _RESULT_LINE_RE.match(next_line) is None
                        and _RESULT_LINE_NO_AGE_RE.match(next_line) is None
                    ):
                        # Strip reaction-time tokens like "r:+0.72"
                        # and parenthesized individual splits like "(26.63)".
                        clean = re.sub(r"r:\+?\d+\.\d+", "", next_line)
                        clean = re.sub(r"\([^)]*\)", "", clean)
                        for st in _TIME_VALUE_RE.findall(clean):
                            seconds = parse_time(st)
                            if seconds is not None:
                                splits.append(seconds)
                        j += 1
                    else:
                        break

                if splits and event_info.get("distance"):
                    result["splits"] = _build_splits(
                        splits, event_info["distance"]
                    )

                results.append(result)
                i = j
                continue

            i += 1

        return {
            "event_number": event_info.get("event_number"),
            "distance": event_info.get("distance", 0),
            "stroke": event_info.get("stroke", "Freestyle"),
            "gender": event_info.get("gender"),
            "age_group": event_info.get("age_group"),
            "round": event_round,
            "is_relay": event_info.get("is_relay", False),
            "results": results,
        }

    def scrape_meet(self, meet_url: str) -> dict:
        """Discover events, fetch each page, parse all results.

        Args:
            meet_url: URL of the Hy-Tek meet index page.

        Returns:
            Dict with ``meet_info`` and ``events`` keys.
        """
        index_html = self.fetch(meet_url)
        meet_info = _parse_meet_info(index_html)

        event_links = self.discover_events(meet_url)
        print(f"  Found {len(event_links)} event pages")

        events: list[dict] = []
        for idx, ev_link in enumerate(event_links, 1):
            print(f"  [{idx}/{len(event_links)}] {ev_link['event_name']}")
            try:
                ev_html = self.fetch(ev_link["url"])
                event_data = self.parse_event_page(ev_html)
                events.append(event_data)
                # If meet info is incomplete, try extracting from first event page.
                if not meet_info.get("date") and idx == 1:
                    better_info = _parse_meet_info(ev_html)
                    if better_info.get("date"):
                        meet_info.update(
                            {k: v for k, v in better_info.items() if v}
                        )
            except Exception as exc:
                print(f"    Warning: failed to parse {ev_link['url']}: {exc}")

        # Fallback: if no event links were found, the URL may itself be a
        # single results page with <pre> blocks containing multiple events.
        if not event_links:
            pre_blocks = _extract_pre_blocks(index_html)
            if pre_blocks:
                event_data = self.parse_event_page(index_html)
                if event_data.get("results"):
                    events.append(event_data)

        return {"meet_info": meet_info, "events": events}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _is_event_link(href: str, text: str) -> bool:
    """Heuristic: does this link point to an event results page?"""
    href_lower = href.lower()

    # Common Hy-Tek naming: ev1.htm, meet01ev003.htm, results_event_01.html
    if re.search(r"ev\d+", href_lower):
        return True
    if re.search(r"event.?\d+", href_lower):
        return True
    if re.search(r"results.*\d+", href_lower):
        return True

    # Link text containing "Event" plus a stroke keyword.
    text_lower = text.lower()
    if "event" in text_lower and any(
        s in text_lower
        for s in ("free", "back", "breast", "fly", "medley", "im", "relay")
    ):
        return True

    # Distance + stroke in the link text.
    if re.search(r"\d+\s*(free|back|breast|fly|im|medley)", text_lower):
        return True

    return False


def _parse_event_header(text: str, title: str) -> dict:
    """Extract event metadata from <pre> text and page title."""
    info: dict = {
        "event_number": None,
        "distance": 0,
        "stroke": "Freestyle",
        "gender": None,
        "age_group": None,
        "is_relay": False,
    }

    header_match = _EVENT_HEADER_RE.search(text)
    if not header_match:
        header_match = _EVENT_HEADER_RE.search(title)

    if header_match:
        info["event_number"] = int(header_match.group("event_number"))
        description = header_match.group("description").strip()

        if _RELAY_RE.search(description):
            info["is_relay"] = True

        try:
            parsed = parse_event_description(description)
            info["distance"] = parsed["distance"]
            info["stroke"] = parsed["stroke"]
            info["gender"] = parsed.get("gender")
            info["age_group"] = parsed.get("age_group")
        except ValueError:
            # Manual fallback.
            dist_match = re.search(r"(\d+)", description)
            if dist_match:
                info["distance"] = int(dist_match.group(1))
            for word in description.split():
                try:
                    info["stroke"] = normalize_stroke(word)
                    break
                except ValueError:
                    continue

    return info


def _parse_result_line(line: str) -> dict | None:
    """Try to parse a fixed-width result line into a structured dict."""
    match = _RESULT_LINE_RE.match(line)
    age: int | None = None

    if match:
        age = int(match.group("age"))
    else:
        match = _RESULT_LINE_NO_AGE_RE.match(line)
        if match is None:
            return None

    place_str = match.group("place")
    name = match.group("name").strip()
    team = match.group("team").strip()

    # In prelims+finals format, the line may have two times (prelim then final).
    # We want the LAST time or status code on the line.
    # Find all time values and status codes after the team name.
    after_team = line[match.end("team"):]
    all_times = _TIME_VALUE_RE.findall(after_team)
    all_statuses = [s for s in _DQ_STATUSES if re.search(rf"\b{s}\b", after_team.upper())]

    # Use the last status code if present, otherwise the last time value.
    place: int | None = int(place_str) if place_str else None
    status: str | None = None
    time_seconds: float | None = None
    time_text: str

    if all_statuses:
        status = all_statuses[-1]
        time_text = status
    elif all_times:
        time_text = all_times[-1]  # last time = finals time (or only time)
        time_seconds = parse_time(time_text)
        if time_seconds is None:
            status = "UNKNOWN"
        # If there were two times, the first is the seed/prelim time.
        seed_time_text = all_times[0] if len(all_times) > 1 else None
    else:
        # Fallback to regex-captured time.
        time_text = match.group("time_text").strip()
        if time_text.upper() in _DQ_STATUSES:
            status = time_text.upper()
        else:
            time_seconds = parse_time(time_text)
            if time_seconds is None:
                status = "UNKNOWN"

    result: dict = {
        "place": place,
        "name": name,
        "team": team,
        "time_text": time_text if status is None else None,
        "time_seconds": time_seconds,
        "status": status,
    }

    # Include seed/prelim time if available.
    if status is None and all_times and len(all_times) > 1:
        seed_seconds = parse_time(all_times[0])
        if seed_seconds is not None:
            result["seed_time_seconds"] = seed_seconds

    if age is not None:
        result["age"] = age

    # Exhibition swims.
    exhibition_str = match.groupdict().get("exhibition")
    if exhibition_str:
        result["place"] = None
        result["status"] = "EXH"

    return result


def _build_splits(
    cumulative_times: list[float], event_distance: int
) -> list[dict]:
    """Build structured split data from cumulative time values.

    Hy-Tek reports cumulative times at regular intervals (e.g. every 50m
    for a 200m event).
    """
    if not cumulative_times:
        return []

    num_splits = len(cumulative_times)
    interval = event_distance // num_splits if num_splits > 0 else 50
    if interval not in (25, 50, 100):
        interval = 50

    splits: list[dict] = []
    prev_time = 0.0

    for idx, cum_time in enumerate(cumulative_times):
        distance = interval * (idx + 1)
        split_seconds = round(cum_time - prev_time, 2)
        splits.append({
            "distance": distance,
            "cumulative_seconds": cum_time,
            "split_seconds": split_seconds,
        })
        prev_time = cum_time

    return splits


def _parse_meet_info(html: str) -> dict:
    """Extract meet-level metadata from the index or event page."""
    title = _extract_title(html)
    pre_blocks = _extract_pre_blocks(html)
    all_text = title + "\n" + "\n".join(pre_blocks)

    info: dict = {
        "name": title if title else "Unknown Meet",
        "date": None,
        "course": "LCM",
        "city": None,
        "province_state": None,
        "country": None,
    }

    # Try to find a better meet name from <pre> content.
    # Hy-Tek often has the meet name on its own line in the <pre> block,
    # like "      Winter Provincial Championships - 3/19/2026 to 3/22/2026"
    for block in pre_blocks:
        for line in block.splitlines():
            stripped = line.strip()
            # Look for lines with the meet name pattern: "Name - date to date"
            m = re.match(
                r"^(.+?)\s*[-\u2014]\s*\d{1,2}/\d{1,2}/\d{4}\s+to\s+\d{1,2}/\d{1,2}/\d{4}",
                stripped,
            )
            if m:
                info["name"] = m.group(1).strip()
                break
            # Also match "Name - Month Day-Day, Year"
            m2 = re.match(
                r"^(.+?)\s*[-\u2014]\s*\w+\s+\d{1,2}",
                stripped,
            )
            if m2 and len(m2.group(1)) > 5 and "license" not in m2.group(1).lower():
                info["name"] = m2.group(1).strip()
                break

    # Cleaner meet name from title as fallback.
    if info["name"] in ("Unknown Meet", "") or "index" in info["name"].lower():
        name_match = _MEET_NAME_RE.search(all_text)
        if name_match:
            candidate = name_match.group(1).strip()
            if "index" not in candidate.lower():
                info["name"] = candidate

    # Course type.
    course_match = _COURSE_RE.search(all_text)
    if course_match:
        raw = course_match.group(1).lower().strip()
        info["course"] = _COURSE_NORMALIZE.get(raw, raw.upper())

    # Also detect course from "LC Meter" or "SC Yard" in event descriptions.
    if "LC Met" in all_text:
        info["course"] = "LCM"
    elif "SC Met" in all_text:
        info["course"] = "SCM"
    elif "SC Yard" in all_text:
        info["course"] = "SCY"

    # Start date — try multiple formats.
    date_match = _DATE_RE.search(all_text)
    if date_match:
        if date_match.group("iso"):
            info["date"] = date_match.group("iso")
        elif date_match.group("us_month"):
            month = int(date_match.group("us_month"))
            day = int(date_match.group("us_day"))
            year = date_match.group("us_year")
            info["date"] = f"{year}-{month:02d}-{day:02d}"
        else:
            month_str = date_match.group("month").lower()
            month_num = _MONTH_MAP.get(month_str)
            if month_num:
                day = int(date_match.group("day"))
                year = date_match.group("year")
                info["date"] = f"{year}-{month_num}-{day:02d}"

    return info
