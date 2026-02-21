"""Router (controller) — search feature."""

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.shared.database import get_session
from syskey.features.search.search_schemas import SearchResult
import syskey.features.search.search_service as service

router = APIRouter()


@router.get(
    "/", response_model=List[SearchResult], summary="Search documents by keyword"
)
async def search(
    q: str = Query(..., min_length=1, description="Keyword or phrase to search for"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    session: AsyncSession = Depends(get_session),
) -> List[SearchResult]:
    """Full-text search powered by SQLite FTS5."""
    return await service.search(q, limit, session)
