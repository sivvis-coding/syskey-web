"""Service — keyword analysis across project files."""

import json
import re
from datetime import datetime, timezone
from typing import List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.features.projects.projects_models import Project
from syskey.features.projects.analysis_schemas import AnalysisResponse, AnalysisRow
from syskey.features.projects.projects_service import get_project_or_404


def _count_occurrences(content: str, keyword: str) -> int:
    """Count non-overlapping occurrences, case-insensitive."""
    if not content or not keyword:
        return 0
    pattern = re.compile(re.escape(keyword.strip()), re.IGNORECASE)
    return len(pattern.findall(content))


async def get_saved_analysis(
    project_id: int, session: AsyncSession
) -> AnalysisResponse | None:
    """Return the last saved analysis, with is_stale=True if keywords or files changed."""
    row = await session.execute(
        text(
            "SELECT rows_json, snapshot_json, analyzed_at FROM analysis_cache WHERE project_id = :pid"
        ),
        {"pid": project_id},
    )
    record = row.fetchone()
    if record is None:
        return None

    rows = [AnalysisRow(**r) for r in json.loads(record.rows_json)]
    analyzed_at = (
        datetime.fromisoformat(record.analyzed_at)
        if isinstance(record.analyzed_at, str)
        else record.analyzed_at
    )

    # Compare snapshot vs current project state
    snapshot = json.loads(record.snapshot_json or "{}")
    project: Project = await get_project_or_404(project_id, session)
    current_keywords = sorted(kw.keyword for kw in project.keywords)
    current_file_ids = sorted(f.id for f in project.files)
    is_stale = (
        snapshot.get("keywords") != current_keywords
        or snapshot.get("file_ids") != current_file_ids
    )

    return AnalysisResponse(
        project_id=project_id,
        rows=rows,
        analyzed_at=analyzed_at,
        is_stale=is_stale,
    )


async def run_and_save_analysis(
    project_id: int, session: AsyncSession
) -> AnalysisResponse:
    """Run full analysis, persist result, and return it."""
    project: Project = await get_project_or_404(project_id, session)

    keywords = [kw.keyword for kw in project.keywords]
    if not keywords:
        rows: List[AnalysisRow] = []
    else:
        file_ids = [f.id for f in project.files]
        if not file_ids:
            rows = []
        else:
            placeholders = ", ".join(f":fid_{i}" for i in range(len(file_ids)))
            params = {f"fid_{i}": fid for i, fid in enumerate(file_ids)}
            result = await session.execute(
                text(
                    f"SELECT file_id, filename, content "
                    f"FROM documents_fts WHERE file_id IN ({placeholders})"
                ),
                params,
            )
            file_contents = {
                row.file_id: (row.filename, row.content or "")
                for row in result.fetchall()
            }
            rows = []
            for file_id in file_ids:
                if file_id not in file_contents:
                    continue
                filename, content = file_contents[file_id]
                for keyword in keywords:
                    count = _count_occurrences(content, keyword)
                    rows.append(
                        AnalysisRow(
                            file_id=file_id,
                            filename=filename,
                            keyword=keyword,
                            count=count,
                        )
                    )
            rows.sort(key=lambda r: (-r.count, r.filename.lower(), r.keyword))

    analyzed_at = datetime.now(timezone.utc)
    rows_json = json.dumps([r.model_dump() for r in rows])
    snapshot_json = json.dumps(
        {
            "keywords": sorted(kw.keyword for kw in project.keywords),
            "file_ids": sorted(f.id for f in project.files),
        }
    )

    await session.execute(
        text(
            """
            INSERT INTO analysis_cache (project_id, rows_json, snapshot_json, analyzed_at)
            VALUES (:pid, :rows_json, :snapshot_json, :analyzed_at)
            ON CONFLICT(project_id) DO UPDATE SET
                rows_json     = excluded.rows_json,
                snapshot_json = excluded.snapshot_json,
                analyzed_at   = excluded.analyzed_at
            """
        ),
        {
            "pid": project_id,
            "rows_json": rows_json,
            "snapshot_json": snapshot_json,
            "analyzed_at": analyzed_at.isoformat(),
        },
    )
    await session.commit()

    return AnalysisResponse(
        project_id=project_id, rows=rows, analyzed_at=analyzed_at, is_stale=False
    )
