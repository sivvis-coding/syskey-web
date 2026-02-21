"""Router (controller) — files feature."""

from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.shared.database import get_session
from syskey.features.files.files_schemas import FileResponse
import syskey.features.files.files_service as service

router = APIRouter()


@router.post(
    "/upload",
    response_model=List[FileResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload one or more files",
)
async def upload_files(
    files: List[UploadFile] = File(..., description="Files to upload"),
    session: AsyncSession = Depends(get_session),
) -> List[FileResponse]:
    return await service.upload_files(files, session)


@router.get("/", response_model=List[FileResponse], summary="List all uploaded files")
async def list_files(
    session: AsyncSession = Depends(get_session),
) -> List[FileResponse]:
    return await service.list_files(session)
