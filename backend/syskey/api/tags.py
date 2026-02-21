"""API router — document tag management."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.db.database import get_session
from syskey.db.models import FileRecord, TagRecord

router = APIRouter()


class TagsIn(BaseModel):
    tags: List[str] = Field(..., min_length=1, description="List of tags to assign")


class TagsOut(BaseModel):
    file_id: int
    tags: List[str]


@router.put(
    "/{file_id}",
    response_model=TagsOut,
    summary="Replace all tags for a file",
)
async def set_tags(
    file_id: int,
    body: TagsIn,
    session: AsyncSession = Depends(get_session),
) -> TagsOut:
    """Replace the complete set of tags for *file_id*."""
    result = await session.execute(select(FileRecord).where(FileRecord.id == file_id))
    file_record = result.scalar_one_or_none()
    if file_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    # Delete existing tags then insert new ones
    existing = await session.execute(select(TagRecord).where(TagRecord.file_id == file_id))
    for tag_rec in existing.scalars().all():
        await session.delete(tag_rec)

    new_tags = [TagRecord(file_id=file_id, tag=t.strip()) for t in body.tags if t.strip()]
    session.add_all(new_tags)
    await session.commit()

    return TagsOut(file_id=file_id, tags=[t.tag for t in new_tags])


@router.get(
    "/{file_id}",
    response_model=TagsOut,
    summary="Get all tags for a file",
)
async def get_tags(
    file_id: int,
    session: AsyncSession = Depends(get_session),
) -> TagsOut:
    """Return the tags currently assigned to *file_id*."""
    result = await session.execute(select(TagRecord).where(TagRecord.file_id == file_id))
    tags = [r.tag for r in result.scalars().all()]
    return TagsOut(file_id=file_id, tags=tags)
