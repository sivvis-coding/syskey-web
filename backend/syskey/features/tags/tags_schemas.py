"""Pydantic schemas — tags feature."""

from typing import List

from pydantic import BaseModel, Field


class TagsIn(BaseModel):
    tags: List[str] = Field(..., min_length=1, description="List of tags to assign")


class TagsOut(BaseModel):
    file_id: int
    tags: List[str]
