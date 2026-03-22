"""Database operations using the Supabase client."""

from supabase import Client

from src.database.models import Meet, Swimmer, Event, Result, Split


def upsert_meet(client: Client, meet: Meet) -> str:
    """Insert or update a meet, returning its id.

    Uses source_url + source_name to detect an existing record.
    """
    data = meet.to_dict()

    # Check for existing meet by source_url + source_name
    if meet.source_url and meet.source_name:
        existing = (
            client.table("meets")
            .select("id")
            .eq("source_url", meet.source_url)
            .eq("source_name", meet.source_name)
            .execute()
        )
        if existing.data:
            meet_id = existing.data[0]["id"]
            client.table("meets").update(data).eq("id", meet_id).execute()
            return meet_id

    result = client.table("meets").insert(data).execute()
    return result.data[0]["id"]


def upsert_swimmer(client: Client, swimmer: Swimmer) -> str:
    """Insert or find an existing swimmer by name + birth_year, returning id."""
    data = swimmer.to_dict()

    query = (
        client.table("swimmers")
        .select("id")
        .eq("first_name", swimmer.first_name)
        .eq("last_name", swimmer.last_name)
    )
    if swimmer.birth_year is not None:
        query = query.eq("birth_year", swimmer.birth_year)

    existing = query.execute()
    if existing.data:
        return existing.data[0]["id"]

    result = client.table("swimmers").insert(data).execute()
    return result.data[0]["id"]


def upsert_event(client: Client, event: Event) -> str:
    """Insert or find an existing event by meet_id + event_number + round, returning id."""
    data = event.to_dict()

    if event.event_number is not None:
        existing = (
            client.table("events")
            .select("id")
            .eq("meet_id", event.meet_id)
            .eq("event_number", event.event_number)
            .eq("round", event.round)
            .execute()
        )
        if existing.data:
            return existing.data[0]["id"]

    result = client.table("events").insert(data).execute()
    return result.data[0]["id"]


def upsert_result(client: Client, result_obj: Result) -> str:
    """Insert or update a result by event_id + swimmer_id, returning id."""
    data = result_obj.to_dict()

    existing = (
        client.table("results")
        .select("id")
        .eq("event_id", result_obj.event_id)
        .eq("swimmer_id", result_obj.swimmer_id)
        .execute()
    )
    if existing.data:
        result_id = existing.data[0]["id"]
        client.table("results").update(data).eq("id", result_id).execute()
        return result_id

    response = client.table("results").insert(data).execute()
    return response.data[0]["id"]


def insert_splits(client: Client, splits: list[Split]) -> int:
    """Bulk upsert splits for a result. Returns the count inserted."""
    if not splits:
        return 0

    rows = [s.to_dict() for s in splits]
    result = (
        client.table("splits")
        .upsert(rows, on_conflict="result_id,distance")
        .execute()
    )
    return len(result.data)


def log_scrape_start(client: Client, source_name: str, source_url: str) -> str:
    """Create a scrape_log entry with status='started', returning its id."""
    data = {
        "source_name": source_name,
        "source_url": source_url,
        "status": "started",
    }
    result = client.table("scrape_log").insert(data).execute()
    return result.data[0]["id"]


def log_scrape_end(
    client: Client,
    log_id: str,
    status: str,
    records_found: int,
    records_inserted: int,
    records_updated: int,
    error_message: str | None = None,
) -> None:
    """Update a scrape_log entry with final status and counts."""
    data = {
        "status": status,
        "records_found": records_found,
        "records_inserted": records_inserted,
        "records_updated": records_updated,
    }
    if error_message is not None:
        data["error_message"] = error_message

    client.table("scrape_log").update(data).eq("id", log_id).execute()


def check_already_scraped(client: Client, source_name: str, source_url: str) -> bool:
    """Check if this URL was successfully scraped before."""
    existing = (
        client.table("scrape_log")
        .select("id")
        .eq("source_name", source_name)
        .eq("source_url", source_url)
        .eq("status", "success")
        .limit(1)
        .execute()
    )
    return len(existing.data) > 0
