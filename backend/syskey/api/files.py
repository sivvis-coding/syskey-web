"""API router — bulk file upload."""

import mimetypes
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.db.database import get_session
from syskey.db.models import FileRecord
from syskey.services import indexer, storage

router = APIRouter()


class FileResponse(BaseModel):
    id: int
    filename: str
    content_type: str | None
    size_bytes: int

    model_config = {"from_attributes": True}


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
    """Accept multiple files, store them on disk, and index their text content."""
    results: List[FileResponse] = []

    for upload in files:
        data = await upload.read()
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{upload.filename}' is empty.",
            )

        dest = await storage.save_file(upload.filename or "unnamed", data)

        record = FileRecord(
            filename=upload.filename or "unnamed",
            content_type=upload.content_type
            or mimetypes.guess_type(upload.filename or "")[0],
            size_bytes=len(data),
            storage_path=str(dest),
        )
        session.add(record)
        await session.flush()  # populate record.id

        # Best-effort text extraction — index plain text / UTF-8 files
        try:
            text_content = data.decode("utf-8", errors="replace")
            await indexer.index_document(session, record.id, record.filename, text_content)
        except Exception:
            pass  # Non-text files are stored but not indexed

        await session.commit()
        await session.refresh(record)
        results.append(FileResponse.model_validate(record))

    return results


@router.get("/", response_model=List[FileResponse], summary="List all uploaded files")
async def list_files(
    session: AsyncSession = Depends(get_session),
) -> List[FileResponse]:
    """Return every file stored in the database."""
    rows = await session.execute(select(FileRecord).order_by(FileRecord.created_at.desc()))
    return [FileResponse.model_validate(r) for r in rows.scalars().all()]
