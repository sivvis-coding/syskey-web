"""Service — document classification and ZIP export."""

import io
import json
import zipfile
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.features.files.files_models import FileRecord
from syskey.features.projects.projects_service import get_project_or_404


async def _build_zip(file_records: list[FileRecord]) -> bytes:
    """Build an in-memory ZIP from a list of FileRecord objects."""
    buf = io.BytesIO()
    seen_names: dict[str, int] = {}

    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for rec in file_records:
            path = Path(rec.storage_path)
            if not path.exists():
                continue  # file missing from disk — skip silently

            # Deduplicate filenames inside the ZIP
            name = rec.filename
            if name in seen_names:
                seen_names[name] += 1
                stem = path.stem
                suffix = path.suffix or ""
                name = f"{stem} ({seen_names[name]}){suffix}"
            else:
                seen_names[name] = 0

            zf.write(path, arcname=name)

    buf.seek(0)
    return buf.read()


async def export_zip(
    project_id: int,
    matched: bool,
    session: AsyncSession,
) -> bytes:
    """Return a ZIP of project files that are matched (≥1 keyword hit) or unmatched.

    Raises 404 if the project doesn't exist, 422 if analysis has never been run.
    """
    project = await get_project_or_404(project_id, session)

    # Load analysis cache
    cache_row = await session.execute(
        text("SELECT rows_json FROM analysis_cache WHERE project_id = :pid"),
        {"pid": project_id},
    )
    cache = cache_row.fetchone()
    if cache is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Run the analysis first before exporting.",
        )

    # Sum counts per file_id from the cached rows
    rows = json.loads(cache.rows_json)
    file_totals: dict[int, int] = {}
    for row in rows:
        fid = row["file_id"]
        file_totals[fid] = file_totals.get(fid, 0) + row["count"]

    # Determine which project file IDs qualify
    all_file_ids = {f.id for f in project.files}
    if matched:
        target_ids = {
            fid for fid, total in file_totals.items() if total > 0
        } & all_file_ids
    else:
        # Unmatched = files with 0 total OR files not in the analysis at all
        matched_ids = {fid for fid, total in file_totals.items() if total > 0}
        target_ids = all_file_ids - matched_ids

    if not target_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No files in this category.",
        )

    # Fetch FileRecord objects for the target IDs
    result = await session.execute(
        select(FileRecord).where(FileRecord.id.in_(target_ids))
    )
    records = list(result.scalars().all())

    return await _build_zip(records)
