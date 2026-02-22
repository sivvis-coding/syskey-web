"""PDF text extraction using PyMuPDF (fitz).

PyMuPDF is the most capable open-source library for extracting readable text
from complex PDFs: multi-column layouts, embedded fonts, rotated text, etc.

Extraction runs synchronously inside a ThreadPoolExecutor so it does not block
the async event loop.
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor

import fitz  # PyMuPDF

# Shared thread-pool for CPU-bound extraction work
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="pdf-extract")


def _extract_sync(data: bytes) -> str:
    """Extract all text from PDF bytes.

    Uses PyMuPDF's 'blocks' text extraction strategy, which preserves the
    reading order of text blocks even in complex multi-column layouts.
    Returns a single string with all pages separated by form-feed characters.
    """
    pages: list[str] = []

    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            # "blocks" gives (x0, y0, x1, y1, text, block_no, block_type)
            # Sort by vertical then horizontal position to respect reading order
            blocks = page.get_text("blocks", sort=True)  # sort=True uses reading order
            page_text = "\n".join(
                b[4].strip()
                for b in blocks
                if b[6] == 0 and b[4].strip()  # block_type 0 = text (not image)
            )
            if page_text:
                pages.append(page_text)

    return "\f".join(pages)  # \f = form feed as page separator


async def extract_text(data: bytes) -> str:
    """Async wrapper: runs PDF extraction in a thread to avoid blocking the loop."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, _extract_sync, data)
