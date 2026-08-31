# Regex-based extraction utilities for resume text.
# These can be used as fallbacks or validation alongside LLM profiling.

import re


def find_email(text: str) -> str | None:
    match = re.search(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text,
    )
    return match.group(0) if match else None


def find_phone(text: str) -> str | None:
    match = re.search(
        r"(?:\+91[-\s]?)?[6-9]\d{9}",
        text,
    )
    return match.group(0) if match else None


def find_github(text: str) -> str | None:
    match = re.search(
        r"github\.com/[A-Za-z0-9_-]+",
        text,
        re.IGNORECASE,
    )
    return match.group(0) if match else None


def find_linkedin(text: str) -> str | None:
    match = re.search(
        r"linkedin\.com/in/[A-Za-z0-9_-]+",
        text,
        re.IGNORECASE,
    )
    return match.group(0) if match else None


def find_name(text: str) -> str | None:
    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        if "@" in line:
            continue

        if "github" in line.lower():
            continue

        if "linkedin" in line.lower():
            continue

        if any(ch.isdigit() for ch in line):
            continue

        return line

    return None


def find_location(text: str) -> str | None:
    header = "\n".join(text.splitlines()[:10])

    match = re.search(
        r"[A-Z][a-zA-Z ]+,\s*[A-Z][a-zA-Z ]+",
        header,
    )

    if match:
        return match.group(0)

    return None


DATE_RANGE_PATTERN = re.compile(
    r"""
    (?P<start>
        (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)
        \.?
        \s+
        \d{4}
        |
        \d{4}
    )
    \s*
    [–—-]
    \s*
    (?P<end>
        Present
        |
        Current
        |
        (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)
        \.?
        \s+
        \d{4}
        |
        \d{4}
    )
    """,
    re.IGNORECASE | re.VERBOSE,
)
