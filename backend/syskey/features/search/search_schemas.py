"""Pydantic schemas — search feature."""

from pydantic import BaseModel


class SearchResult(BaseModel):
    file_id: int
    filename: str
    snippet: str
