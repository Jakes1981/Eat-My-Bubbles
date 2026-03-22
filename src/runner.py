"""Main entry point for the Noa Swimming data pipeline."""

import argparse
import sys
import time

from src.database.client import get_client, test_connection
from src.database.operations import (
    log_scrape_start, log_scrape_end, check_already_scraped,
    upsert_meet, upsert_swimmer, upsert_event, upsert_result, insert_splits,
)
from src.database.models import Meet, Swimmer, Event, Result, Split
from src.scrapers.hytek_web import HyTekWebScraper
from src.processors.swimmers import parse_full_name


def _db_retry(fn, *args, max_retries=3, **kwargs):
    """Retry a database operation with fresh client on connection errors."""
    for attempt in range(max_retries):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            err_str = str(e).lower()
            if "connection" in err_str or "terminated" in err_str or "reset" in err_str:
                if attempt < max_retries - 1:
                    time.sleep(1)
                    # Replace the client argument with a fresh one
                    if args and hasattr(args[0], 'table'):
                        args = (get_client(),) + args[1:]
                    continue
            raise


def run_hytek_scrape(url: str, force: bool = False):
    """Scrape a Hy-Tek web results page and store in Supabase."""
    db = get_client()

    # Check if already scraped
    if not force and check_already_scraped(db, "hytek_web", url):
        print(f"Already scraped: {url}")
        print("Use --force to re-scrape")
        return

    # Start logging
    log_id = log_scrape_start(db, "hytek_web", url)

    records_found = 0
    records_inserted = 0

    try:
        with HyTekWebScraper() as scraper:
            print(f"Scraping: {url}")
            meet_data = scraper.scrape_meet(url)

        # Store meet
        meet_info = meet_data.get("meet_info", {})
        meet = Meet(
            name=meet_info.get("name", "Unknown Meet"),
            start_date=meet_info.get("date", "2024-01-01"),
            course=meet_info.get("course", "LCM"),
            source_url=url,
            source_name="hytek_web",
            city=meet_info.get("city"),
            province_state=meet_info.get("province_state"),
            country=meet_info.get("country"),
        )
        meet_id = upsert_meet(db, meet)
        print(f"Meet: {meet.name} (id: {meet_id[:8]}...)")

        # Process each event
        total_events = len(meet_data.get("events", []))
        for ev_idx, event_data in enumerate(meet_data.get("events", []), 1):
            # Refresh DB client every 25 events to avoid connection staleness
            if ev_idx % 25 == 0:
                db = get_client()

            event = Event(
                meet_id=meet_id,
                distance=event_data.get("distance", 0),
                stroke=event_data.get("stroke", "Freestyle"),
                event_number=event_data.get("event_number"),
                gender=event_data.get("gender"),
                age_group=event_data.get("age_group"),
                round=event_data.get("round", "Finals"),
                is_relay=event_data.get("is_relay", False),
            )
            event_id = upsert_event(db, event)

            # Process results for this event
            for result_data in event_data.get("results", []):
                records_found += 1

                # Upsert swimmer
                first_name, last_name = parse_full_name(result_data.get("name", ""))
                swimmer = Swimmer(
                    first_name=first_name,
                    last_name=last_name,
                    birth_year=result_data.get("birth_year"),
                    gender=event_data.get("gender"),
                    club_name=result_data.get("team"),
                )
                swimmer_id = _db_retry(upsert_swimmer, db, swimmer)

                # Upsert result
                result = Result(
                    event_id=event_id,
                    swimmer_id=swimmer_id,
                    final_time_seconds=result_data.get("time_seconds"),
                    final_time_text=result_data.get("time_text"),
                    team_name=result_data.get("team"),
                    place=result_data.get("place"),
                    heat=result_data.get("heat"),
                    lane=result_data.get("lane"),
                    status=result_data.get("status"),
                )
                result_id = _db_retry(upsert_result, db, result)
                records_inserted += 1

                # Insert splits if present
                splits_data = result_data.get("splits", [])
                if splits_data:
                    splits = [
                        Split(
                            result_id=result_id,
                            distance=s["distance"],
                            cumulative_time_seconds=s["cumulative_seconds"],
                            split_time_seconds=s.get("split_seconds"),
                        )
                        for s in splits_data
                    ]
                    _db_retry(insert_splits, db, splits)

            if ev_idx % 10 == 0:
                print(f"  Stored {ev_idx}/{total_events} events ({records_found} results so far)")

        log_scrape_end(db, log_id, "success", records_found, records_inserted, 0)
        print(f"\nDone! Found {records_found} results, stored {records_inserted}")

    except Exception as e:
        log_scrape_end(db, log_id, "failed", records_found, records_inserted, 0, str(e))
        print(f"Error: {e}", file=sys.stderr)
        raise


def main():
    parser = argparse.ArgumentParser(description="Noa Swimming Data Pipeline")
    parser.add_argument("--source", choices=["hytek_web"], default="hytek_web",
                        help="Data source to scrape")
    parser.add_argument("--url", default=None, help="URL to scrape")
    parser.add_argument("--force", action="store_true",
                        help="Force re-scrape even if already done")
    parser.add_argument("--test-connection", action="store_true",
                        help="Test database connection and exit")

    args = parser.parse_args()

    if args.test_connection:
        if test_connection():
            print("Connection successful!")
        else:
            print("Connection failed!", file=sys.stderr)
            sys.exit(1)
        return

    if not args.url:
        print("Error: --url is required for scraping", file=sys.stderr)
        sys.exit(1)

    if args.source == "hytek_web":
        run_hytek_scrape(args.url, force=args.force)


if __name__ == "__main__":
    main()
