"""API router — keyword search with highlighted snippets."""

from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.db.database import get_session
from syskey.services.indexer import SearchHit, search_documents

router = APIRouter()


class SearchResult(BaseModel):
    file_id: int
    filename: str
    snippet: str


@router.get("/", response_model=List[SearchResult], summary="Search documents by keyword")
async def search(
    q: str = Query(..., min_length=1, description="Keyword or phrase to search for"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    session: AsyncSession = Depends(get_session),
) -> List[SearchResult]:
    """Full-text search powered by SQLite FTS5.

    Returns matching documents with highlighted snippets showing where the
    keyword appears in the document content.
    """
    hits: List[SearchHit] = await search_documents(session, q, limit=limit)
    return [
        SearchResult(file_id=h.file_id, filename=h.filename, snippet=h.snippet)
        for h in hits
    ]
