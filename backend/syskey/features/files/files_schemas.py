"""Pydantic schemas — files feature."""

from pydantic import BaseModel


class FileResponse(BaseModel):
    id: int
    filename: str
    content_type: str | None
    size_bytes: int

    model_config = {"from_attributes": True}
