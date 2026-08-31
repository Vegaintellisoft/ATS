"""
Deterministic experience calculation service.

All functions are pure / side-effect-free and depend only on the
LLM-extracted ``experience`` list from the resume profile.  They
never make network calls, so they are fast, cheap, and trivially
unit-testable.

Date-string conventions accepted (case-insensitive):
  - Full month name : "January 2021", "january 2021"
  - Short month     : "Jan 2021",  "Jan. 2021"
  - Year only       : "2021"
  - Present markers : "Present", "Current", "Now", "Till Date",
                      "Till date", "ongoing", "—" (em-dash alone),
                      empty string / None
"""

from __future__ import annotations

import calendar
import re
from datetime import date, datetime
from typing import Any

# ---------------------------------------------------------------------------
# Month name → number
# ---------------------------------------------------------------------------
_MONTH_MAP: dict[str, int] = {
    "jan": 1,  "january": 1,
    "feb": 2,  "february": 2,
    "mar": 3,  "march": 3,
    "apr": 4,  "april": 4,
    "may": 5,
    "jun": 6,  "june": 6,
    "jul": 7,  "july": 7,
    "aug": 8,  "august": 8,
    "sep": 9,  "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

_PRESENT_TOKENS = {
    "present", "current", "now", "ongoing",
    "till date", "tilldate", "to date", "todate",
    "continuing", "continued", "—", "-", "",
}


# ---------------------------------------------------------------------------
# Public API: date parsing
# ---------------------------------------------------------------------------

def parse_date(
    raw: str | None,
    *,
    prefer_end: bool = False,
) -> date | None:
    """
    Parse a resume date string into a ``datetime.date``.

    Parameters
    ----------
    raw : str | None
        The raw string from the LLM output.
    prefer_end : bool
        When only a year is given (e.g. ``"2021"``), use Dec 31 if
        ``prefer_end=True``, else Jan 1.  Use ``prefer_end=True`` for
        end-dates to avoid underestimating experience duration.

    Returns
    -------
    date | None
        Parsed date, or ``None`` if the input is unparseable.
    """
    if raw is None:
        return None

    s = raw.strip().lower().rstrip(".")

    # --- Present / ongoing markers -----------------------------------------
    if s in _PRESENT_TOKENS:
        return date.today()

    # --- "Month YYYY" or "Month. YYYY" ------------------------------------
    m = re.fullmatch(
        r"([a-z]+)\.?\s+(\d{4})",
        s,
    )
    if m:
        month_name, year_str = m.group(1), m.group(2)
        month = _MONTH_MAP.get(month_name)
        if month:
            year = int(year_str)
            if prefer_end:
                day = calendar.monthrange(year, month)[1]
            else:
                day = 1
            try:
                return date(year, month, day)
            except ValueError:
                pass

    # --- Year only ---------------------------------------------------------
    m = re.fullmatch(r"(\d{4})", s)
    if m:
        year = int(m.group(1))
        if prefer_end:
            return date(year, 12, 31)
        return date(year, 1, 1)

    # --- YYYY-MM or YYYY/MM -----------------------------------------------
    m = re.fullmatch(r"(\d{4})[-/](\d{1,2})", s)
    if m:
        year, month = int(m.group(1)), int(m.group(2))
        if prefer_end:
            day = calendar.monthrange(year, month)[1]
        else:
            day = 1
        try:
            return date(year, month, day)
        except ValueError:
            pass

    # --- MM/YYYY or MM-YYYY -----------------------------------------------
    m = re.fullmatch(r"(\d{1,2})[-/](\d{4})", s)
    if m:
        month, year = int(m.group(1)), int(m.group(2))
        if prefer_end:
            day = calendar.monthrange(year, month)[1]
        else:
            day = 1
        try:
            return date(year, month, day)
        except ValueError:
            pass

    return None


# ---------------------------------------------------------------------------
# Public API: single-job tenure
# ---------------------------------------------------------------------------

def calculate_tenure_months(job: dict[str, Any]) -> float:
    """Return tenure in months for a single experience entry."""
    start = parse_date(job.get("startDate"), prefer_end=False)
    end   = parse_date(job.get("endDate"),   prefer_end=True)

    if start is None or end is None:
        return 0.0

    if end < start:
        return 0.0

    months = (
        (end.year - start.year) * 12
        + (end.month - start.month)
    )
    # Add fractional days within the final month
    months += (end.day - start.day) / calendar.monthrange(end.year, end.month)[1]
    return max(0.0, months)


# ---------------------------------------------------------------------------
# Internal: build date-range pairs
# ---------------------------------------------------------------------------

def _date_ranges(
    experience_list: list[dict[str, Any]],
) -> list[tuple[date, date]]:
    """Return a list of (start, end) date pairs for parseable entries."""
    ranges: list[tuple[date, date]] = []
    for job in experience_list:
        start = parse_date(job.get("startDate"), prefer_end=False)
        end   = parse_date(job.get("endDate"),   prefer_end=True)
        if start and end and end >= start:
            ranges.append((start, end))
    return sorted(ranges, key=lambda r: r[0])


# ---------------------------------------------------------------------------
# Public API: merge overlapping periods
# ---------------------------------------------------------------------------

def merge_overlapping_periods(
    experience_list: list[dict[str, Any]],
) -> list[tuple[date, date]]:
    """
    Collapse overlapping or adjacent employment intervals so that
    concurrent roles are not double-counted.

    Returns
    -------
    list of (start, end) tuples sorted by start date.
    """
    ranges = _date_ranges(experience_list)
    if not ranges:
        return []

    merged: list[tuple[date, date]] = [ranges[0]]
    for start, end in ranges[1:]:
        prev_start, prev_end = merged[-1]
        if start <= prev_end:                   # overlap or adjacent
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged


# ---------------------------------------------------------------------------
# Public API: total experience
# ---------------------------------------------------------------------------

def calculate_total_experience(
    experience_list: list[dict[str, Any]],
) -> float:
    """
    Total working experience in years (rounded to 1 decimal place).

    Overlapping periods are merged so concurrent roles are not
    double-counted.
    """
    merged = merge_overlapping_periods(experience_list)
    if not merged:
        return 0.0

    total_days = sum(
        (end - start).days for start, end in merged
    )
    years = total_days / 365.25
    return round(years, 1)


# ---------------------------------------------------------------------------
# Public API: career gaps
# ---------------------------------------------------------------------------

def calculate_career_gaps(
    experience_list: list[dict[str, Any]],
    min_gap_months: float = 1.0,
) -> list[dict[str, Any]]:
    """
    Detect gaps between consecutive employment periods.

    Parameters
    ----------
    min_gap_months : float
        Only gaps larger than this threshold are reported (default 1 month).

    Returns
    -------
    list of dicts with keys ``startDate``, ``endDate``, ``months``.
    """
    merged = merge_overlapping_periods(experience_list)
    if len(merged) < 2:
        return []

    gaps: list[dict[str, Any]] = []
    for i in range(1, len(merged)):
        gap_start = merged[i - 1][1]
        gap_end   = merged[i][0]

        if gap_end <= gap_start:
            continue

        gap_months = (
            (gap_end.year - gap_start.year) * 12
            + (gap_end.month - gap_start.month)
        )
        if gap_months >= min_gap_months:
            gaps.append(
                {
                    "startDate": gap_start.isoformat(),
                    "endDate":   gap_end.isoformat(),
                    "months":    gap_months,
                }
            )
    return gaps


# ---------------------------------------------------------------------------
# Public API: current employer / designation
# ---------------------------------------------------------------------------

def _is_current(job: dict[str, Any]) -> bool:
    """Return True if the job's endDate resolves to today or the future."""
    end_raw = job.get("endDate")
    if end_raw is None:
        return False
    s = str(end_raw).strip().lower().rstrip(".")
    if s in _PRESENT_TOKENS:
        return True
    parsed = parse_date(end_raw, prefer_end=True)
    return parsed is not None and parsed >= date.today()


def get_current_company(
    experience_list: list[dict[str, Any]],
) -> str | None:
    """Return the organisation name of the most-recent current role."""
    current = [j for j in experience_list if _is_current(j)]
    if not current:
        return None
    # Sort by start date descending; latest start is the "most current" role
    current.sort(
        key=lambda j: parse_date(j.get("startDate")) or date.min,
        reverse=True,
    )
    return current[0].get("organization")


def get_current_designation(
    experience_list: list[dict[str, Any]],
) -> str | None:
    """Return the job title of the most-recent current role."""
    current = [j for j in experience_list if _is_current(j)]
    if not current:
        return None
    current.sort(
        key=lambda j: parse_date(j.get("startDate")) or date.min,
        reverse=True,
    )
    return current[0].get("title")


# ---------------------------------------------------------------------------
# Public API: profile enrichment (main entry point)
# ---------------------------------------------------------------------------

def enrich_profile(profile: dict[str, Any]) -> dict[str, Any]:
    """
    Attach a ``"computed"`` block to the profile dict (in-place + return).

    The ``"computed"`` key contains all deterministically derived fields.
    The original LLM output is never modified.

    Example output
    --------------
    .. code-block:: json

        {
          "computed": {
            "totalExperienceYears": 4.2,
            "currentCompany": "XYZ Ltd.",
            "currentDesignation": "Senior Software Engineer",
            "careerGaps": [],
            "careerGapMonths": 0,
            "hasOverlappingExperience": false,
            "totalJobs": 2
          }
        }
    """
    experience: list[dict[str, Any]] = profile.get("experience") or []

    # Detect overlap *before* merging
    raw_ranges   = _date_ranges(experience)
    merged       = merge_overlapping_periods(experience)
    has_overlap  = len(raw_ranges) != len(merged) or any(
        merged[i][0] < merged[i - 1][1]
        for i in range(1, len(merged))
    )

    total_years   = calculate_total_experience(experience)
    career_gaps   = calculate_career_gaps(experience)
    gap_months    = sum(g["months"] for g in career_gaps)

    profile["computed"] = {
        "totalExperienceYears": total_years,
        "currentCompany":       get_current_company(experience),
        "currentDesignation":   get_current_designation(experience),
        "careerGaps":           career_gaps,
        "careerGapMonths":      gap_months,
        "hasOverlappingExperience": has_overlap,
        "totalJobs":            len(experience),
    }

    return profile
