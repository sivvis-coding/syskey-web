"""Service — tags business logic."""

from typing import List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.features.files.files_models import FileRecord
from syskey.features.tags.tags_models import TagRecord
from syskey.features.tags.tags_schemas import TagsOut


async def set_tags(file_id: int, tags: List[str], session: AsyncSession) -> TagsOut:
    result = await session.execute(select(FileRecord).where(FileRecord.id == file_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found."
        )

    existing = await session.execute(
        select(TagRecord).where(TagRecord.file_id == file_id)
    )
    for tag_rec in existing.scalars().all():
        await session.delete(tag_rec)

    new_tags = [TagRecord(file_id=file_id, tag=t.strip()) for t in tags if t.strip()]
    session.add_all(new_tags)
    await session.commit()

    return TagsOut(file_id=file_id, tags=[t.tag for t in new_tags])
