"""Full-text indexing service using SQLite FTS5."""

from dataclasses import dataclass
from typing import List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class SearchHit:
    file_id: int
    filename: str
    snippet: str


async def index_document(
    session: AsyncSession,
    file_id: int,
    filename: str,
    content: str,
) -> None:
    """Insert (or replace) a document into the FTS5 index."""
    # Remove any existing entry for this file first
    await session.execute(
        text("DELETE FROM documents_fts WHERE file_id = :fid"),
        {"fid": file_id},
    )
    await session.execute(
        text(
            "INSERT INTO documents_fts (file_id, filename, content) "
            "VALUES (:fid, :fname, :content)"
        ),
        {"fid": file_id, "fname": filename, "content": content},
    )
    await session.commit()


async def search_documents(
    session: AsyncSession,
    query: str,
    limit: int = 20,
) -> List[SearchHit]:
    """Search FTS5 index and return hits with highlighted snippets.

    Uses the built-in FTS5 ``snippet()`` function to extract context around
    each match (up to 64 tokens, highlighted with ``<mark>`` tags).
    """
    rows = await session.execute(
        text(
            """
            SELECT
                file_id,
                filename,
                snippet(documents_fts, 2, '<mark>', '</mark>', '…', 64) AS snippet
            FROM documents_fts
            WHERE documents_fts MATCH :q
            ORDER BY rank
            LIMIT :lim
            """
        ),
        {"q": query, "lim": limit},
    )
    return [
        SearchHit(file_id=row.file_id, filename=row.filename, snippet=row.snippet)
        for row in rows.fetchall()
    ]
