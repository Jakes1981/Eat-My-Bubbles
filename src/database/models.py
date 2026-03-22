"""Python dataclasses matching the Supabase tables."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Swimmer:
    first_name: str
    last_name: str
    birth_year: Optional[int] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    province_state: Optional[str] = None
    club_name: Optional[str] = None
    external_ids: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Return only non-None fields for Supabase insert."""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class Meet:
    name: str
    start_date: str
    location: Optional[str] = None
    city: Optional[str] = None
    province_state: Optional[str] = None
    country: Optional[str] = None
    end_date: Optional[str] = None
    course: str = "LCM"
    meet_type: Optional[str] = None
    sanction_number: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    external_ids: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Return only non-None fields for Supabase insert."""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class Event:
    meet_id: str
    distance: int
    stroke: str
    event_number: Optional[int] = None
    gender: Optional[str] = None
    age_group: Optional[str] = None
    round: str = "Finals"
    is_relay: bool = False

    def to_dict(self) -> dict:
        """Return only non-None fields for Supabase insert."""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class Result:
    event_id: str
    swimmer_id: str
    final_time_seconds: Optional[float] = None
    final_time_text: Optional[str] = None
    seed_time_seconds: Optional[float] = None
    team_name: Optional[str] = None
    place: Optional[int] = None
    heat: Optional[int] = None
    lane: Optional[int] = None
    points: Optional[float] = None
    status: Optional[str] = None
    dq_description: Optional[str] = None
    is_personal_best: Optional[bool] = None

    def to_dict(self) -> dict:
        """Return only non-None fields for Supabase insert."""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class Split:
    result_id: str
    distance: int
    cumulative_time_seconds: float
    split_time_seconds: Optional[float] = None

    def to_dict(self) -> dict:
        """Return only non-None fields for Supabase insert."""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class ScrapeLog:
    source_name: str
    source_url: Optional[str] = None
    status: str = "started"
    records_found: int = 0
    records_inserted: int = 0
    records_updated: int = 0
    error_message: Optional[str] = None

    def to_dict(self) -> dict:
        """Return only non-None fields for Supabase insert."""
        return {k: v for k, v in self.__dict__.items() if v is not None}
