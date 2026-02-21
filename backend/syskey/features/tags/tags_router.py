"""Router (controller) — tags feature."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.shared.database import get_session
from syskey.features.tags.tags_schemas import TagsIn, TagsOut
import syskey.features.tags.tags_service as service

router = APIRouter()


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
    return await service.set_tags(file_id, body.tags, session)
