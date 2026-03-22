"""Comprehensive tests for all processors: times, events, swimmers, conversions."""

import pytest

from src.processors.times import parse_time, format_time, is_valid_time
from src.processors.events import normalize_stroke, parse_event_description
from src.processors.swimmers import parse_full_name, name_similarity, is_likely_same_swimmer
from src.processors.conversions import convert_time, CourseType


# ═══════════════════════════════════════════════════════════════════════════
# Time parsing
# ═══════════════════════════════════════════════════════════════════════════

class TestParseTime:
    """Tests for parse_time()."""

    def test_minutes_and_seconds(self):
        assert parse_time("1:02.34") == 62.34

    def test_seconds_only(self):
        assert parse_time("32.10") == 32.10

    def test_long_distance_time(self):
        assert parse_time("15:02.34") == 902.34

    def test_nt_returns_none(self):
        assert parse_time("NT") is None

    def test_dq_returns_none(self):
        assert parse_time("DQ") is None

    def test_ns_returns_none(self):
        assert parse_time("NS") is None

    def test_scr_returns_none(self):
        assert parse_time("SCR") is None

    def test_case_insensitive_status_codes(self):
        assert parse_time("nt") is None
        assert parse_time("dq") is None
        assert parse_time("Ns") is None

    def test_whitespace_handling(self):
        assert parse_time("  1:02.34  ") == 62.34

    def test_garbage_input_returns_none(self):
        assert parse_time("abc") is None
        assert parse_time("") is None

    def test_zero_time(self):
        assert parse_time("0.00") == 0.0


class TestFormatTime:
    """Tests for format_time()."""

    def test_with_minutes(self):
        assert format_time(62.34) == "1:02.34"

    def test_seconds_only(self):
        assert format_time(32.10) == "32.10"

    def test_long_distance(self):
        assert format_time(902.34) == "15:02.34"

    def test_zero(self):
        assert format_time(0.0) == "0.00"

    def test_negative_raises_error(self):
        with pytest.raises(ValueError):
            format_time(-1.0)

    def test_round_trip(self):
        """parse_time and format_time should be inverses of each other."""
        original = "1:02.34"
        assert format_time(parse_time(original)) == original


class TestIsValidTime:
    """Tests for is_valid_time()."""

    def test_valid_time_with_minutes(self):
        assert is_valid_time("1:02.34") is True

    def test_valid_time_seconds_only(self):
        assert is_valid_time("32.10") is True

    def test_nt_is_not_valid(self):
        assert is_valid_time("NT") is False

    def test_dq_is_not_valid(self):
        assert is_valid_time("DQ") is False

    def test_garbage_is_not_valid(self):
        assert is_valid_time("fast") is False


# ═══════════════════════════════════════════════════════════════════════════
# Event normalization
# ═══════════════════════════════════════════════════════════════════════════

class TestNormalizeStroke:
    """Tests for normalize_stroke()."""

    def test_free_abbreviation(self):
        assert normalize_stroke("Free") == "Freestyle"

    def test_fr_abbreviation(self):
        assert normalize_stroke("FR") == "Freestyle"

    def test_full_backstroke(self):
        assert normalize_stroke("Backstroke") == "Backstroke"

    def test_fly_abbreviation(self):
        assert normalize_stroke("fly") == "Butterfly"

    def test_im_abbreviation(self):
        assert normalize_stroke("IM") == "IM"

    def test_breast_abbreviation(self):
        assert normalize_stroke("breast") == "Breaststroke"

    def test_unknown_stroke_raises(self):
        with pytest.raises(ValueError):
            normalize_stroke("doggy paddle")

    def test_whitespace_tolerance(self):
        assert normalize_stroke("  free  ") == "Freestyle"


class TestParseEventDescription:
    """Tests for parse_event_description()."""

    def test_boys_freestyle(self):
        result = parse_event_description("Boys 11-12 100 Freestyle")
        assert result["gender"] == "M"
        assert result["age_group"] == "11-12"
        assert result["distance"] == 100
        assert result["stroke"] == "Freestyle"

    def test_girls_im(self):
        result = parse_event_description("Girls 13-14 200 IM")
        assert result["gender"] == "F"
        assert result["age_group"] == "13-14"
        assert result["distance"] == 200
        assert result["stroke"] == "IM"

    def test_no_gender_no_age_group(self):
        result = parse_event_description("200 IM")
        assert result["gender"] is None
        assert result["age_group"] is None
        assert result["distance"] == 200
        assert result["stroke"] == "IM"

    def test_men_event(self):
        result = parse_event_description("Men 50 Free")
        assert result["gender"] == "M"
        assert result["distance"] == 50
        assert result["stroke"] == "Freestyle"

    def test_unparseable_raises(self):
        with pytest.raises(ValueError):
            parse_event_description("not an event at all")


# ═══════════════════════════════════════════════════════════════════════════
# Swimmer name handling
# ═══════════════════════════════════════════════════════════════════════════

class TestParseFullName:
    """Tests for parse_full_name()."""

    def test_last_comma_first(self):
        first, last = parse_full_name("Burger, Noa")
        assert first == "Noa"
        assert last == "Burger"

    def test_first_last(self):
        first, last = parse_full_name("Noa Burger")
        assert first == "Noa"
        assert last == "Burger"

    def test_title_case(self):
        first, last = parse_full_name("BURGER, NOA")
        assert first == "Noa"
        assert last == "Burger"

    def test_extra_whitespace(self):
        first, last = parse_full_name("  Burger ,  Noa  ")
        assert first == "Noa"
        assert last == "Burger"

    def test_single_name_raises(self):
        with pytest.raises(ValueError):
            parse_full_name("Noa")


class TestNameSimilarity:
    """Tests for name_similarity()."""

    def test_identical_names(self):
        assert name_similarity("Noa Burger", "Noa Burger") == 1.0

    def test_similar_names(self):
        score = name_similarity("Noa Burger", "Noah Burger")
        assert score > 0.8

    def test_different_names(self):
        score = name_similarity("Noa Burger", "James Smith")
        assert score < 0.5

    def test_case_insensitive(self):
        assert name_similarity("NOA BURGER", "noa burger") == 1.0

    def test_comma_format_vs_normal(self):
        score = name_similarity("Burger, Noa", "Noa Burger")
        assert score == 1.0


class TestIsLikelySameSwimmer:
    """Tests for is_likely_same_swimmer()."""

    def test_matching_name_and_birth_year(self):
        s1 = {"name": "Noa Burger", "birth_year": 2013}
        s2 = {"name": "Noa Burger", "birth_year": 2013}
        assert is_likely_same_swimmer(s1, s2) is True

    def test_different_names(self):
        s1 = {"name": "Noa Burger", "birth_year": 2013}
        s2 = {"name": "James Smith", "birth_year": 2013}
        assert is_likely_same_swimmer(s1, s2) is False

    def test_same_name_different_birth_year(self):
        s1 = {"name": "Noa Burger", "birth_year": 2013}
        s2 = {"name": "Noa Burger", "birth_year": 2010}
        assert is_likely_same_swimmer(s1, s2) is False

    def test_high_confidence_name_only(self):
        """Without birth_year or club, a very high name similarity still matches."""
        s1 = {"name": "Noa Burger"}
        s2 = {"name": "Noa Burger"}
        assert is_likely_same_swimmer(s1, s2) is True

    def test_similar_name_with_club(self):
        s1 = {"name": "Noa Burger", "club": "UCSC-AB"}
        s2 = {"name": "Noa Burger", "club": "UCSC-AB"}
        assert is_likely_same_swimmer(s1, s2) is True


# ═══════════════════════════════════════════════════════════════════════════
# Course conversions
# ═══════════════════════════════════════════════════════════════════════════

class TestConvertTime:
    """Tests for convert_time()."""

    def test_scy_to_lcm_is_slower(self):
        scy_time = 50.0  # 100 Free in SCY
        lcm_time = convert_time(scy_time, CourseType.SCY, CourseType.LCM, 100, "Freestyle")
        assert lcm_time > scy_time

    def test_lcm_to_lcm_is_identity(self):
        time_in = 62.34
        result = convert_time(time_in, CourseType.LCM, CourseType.LCM, 100, "Freestyle")
        assert result == time_in

    def test_scm_to_lcm_is_slower(self):
        scm_time = 55.0  # 100 Free in SCM
        lcm_time = convert_time(scm_time, CourseType.SCM, CourseType.LCM, 100, "Freestyle")
        assert lcm_time > scm_time

    def test_lcm_to_scy_is_faster(self):
        lcm_time = 60.0
        scy_time = convert_time(lcm_time, CourseType.LCM, CourseType.SCY, 100, "Freestyle")
        assert scy_time < lcm_time

    def test_scy_to_scm_round_trip(self):
        """Converting SCY -> SCM -> SCY should return approximately the original."""
        original = 50.0
        scm = convert_time(original, CourseType.SCY, CourseType.SCM, 100, "Freestyle")
        back = convert_time(scm, CourseType.SCM, CourseType.SCY, 100, "Freestyle")
        assert abs(back - original) < 0.05

    def test_negative_time_raises(self):
        with pytest.raises(ValueError):
            convert_time(-1.0, CourseType.SCY, CourseType.LCM, 100, "Freestyle")

    def test_unknown_event_raises(self):
        with pytest.raises(KeyError):
            convert_time(50.0, CourseType.SCY, CourseType.LCM, 9999, "Freestyle")

    def test_result_is_rounded(self):
        result = convert_time(50.0, CourseType.SCY, CourseType.LCM, 100, "Freestyle")
        # Should be rounded to 2 decimal places.
        assert result == round(result, 2)
