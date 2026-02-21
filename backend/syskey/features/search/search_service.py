"""Service — search business logic."""

from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from syskey.features.files.files_indexer import search_documents
from syskey.features.search.search_schemas import SearchResult


async def search(query: str, limit: int, session: AsyncSession) -> List[SearchResult]:
    hits = await search_documents(session, query, limit=limit)
    return [
        SearchResult(file_id=h.file_id, filename=h.filename, snippet=h.snippet)
        for h in hits
    ]
