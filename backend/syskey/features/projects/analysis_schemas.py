"""Pydantic schemas — analysis feature."""

from datetime import datetime

from pydantic import BaseModel


class AnalysisRow(BaseModel):
    file_id: int
    filename: str
    keyword: str
    count: int


class AnalysisResponse(BaseModel):
    project_id: int
    rows: list[AnalysisRow]
    analyzed_at: datetime | None = None
    is_stale: bool = False
