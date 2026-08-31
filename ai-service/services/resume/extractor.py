# Text extraction service (PyMuPDF)

import fitz  # PyMuPDF


def extract_text(pdf_bytes: bytes) -> str:
    text = ""

    with fitz.open(stream=pdf_bytes, filetype="pdf") as pdf:
        for page in pdf:
            text += page.get_text()

    return text.strip()
