"""File storage service — saves uploaded files to the local filesystem."""

import hashlib
from pathlib import Path

import aiofiles

UPLOAD_DIR = Path.home() / ".syskey" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_file(filename: str, data: bytes) -> Path:
    """Persist *data* to disk under a content-addressed subdirectory.

    Returns the absolute path of the saved file.
    """
    # Use first 8 chars of SHA-256 as a bucket prefix to avoid filesystem limits
    digest = hashlib.sha256(data).hexdigest()
    bucket = UPLOAD_DIR / digest[:2]
    bucket.mkdir(parents=True, exist_ok=True)

    dest = bucket / filename
    async with aiofiles.open(dest, "wb") as fh:
        await fh.write(data)

    return dest


async def read_file(storage_path: str) -> bytes:
    """Read file bytes from *storage_path*."""
    async with aiofiles.open(storage_path, "rb") as fh:
        return await fh.read()
