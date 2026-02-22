"""Router (controller) — files feature."""

from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
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
    project_id: Optional[int] = Form(
        None, description="Associate files with a project"
    ),
    session: AsyncSession = Depends(get_session),
) -> List[FileResponse]:
    return await service.upload_files(files, session, project_id=project_id)


@router.get("/", response_model=List[FileResponse], summary="List all uploaded files")
async def list_files(
    session: AsyncSession = Depends(get_session),
) -> List[FileResponse]:
    return await service.list_files(session)


@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a file record",
)
async def delete_file(
    file_id: int,
    session: AsyncSession = Depends(get_session),
) -> Response:
    await service.delete_file(file_id, session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
