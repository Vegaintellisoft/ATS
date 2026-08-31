from storage import download_pdf
from services.resume.extractor import extract_text
from services.resume.profiler import profile_resume
from services.experience import enrich_profile


async def parse_resume(object_key: str):
    pdf_bytes = download_pdf(object_key)

    text = extract_text(pdf_bytes)

    profile = await profile_resume(text)

    # Deterministically compute experience metrics from the LLM output.
    # This attaches a "computed" key to the profile dict — no extra LLM call.
    enrich_profile(profile)

    return {
        "profile": profile,
        "rawText": text,
    }
