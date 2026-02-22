"""Service — files business logic."""

import mimetypes
from typing import List

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.features.files.files_models import FileRecord
from syskey.features.files.files_schemas import FileResponse
from syskey.features.files import (
    files_storage as storage,
    files_indexer as indexer,
    files_extractor as extractor,
)


ALLOWED_CONTENT_TYPES = {"application/pdf"}
ALLOWED_EXTENSIONS = {".pdf"}


def _is_pdf(upload: UploadFile) -> bool:
    if upload.content_type and upload.content_type in ALLOWED_CONTENT_TYPES:
        return True
    name = upload.filename or ""
    return any(name.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)


async def upload_files(
    uploads: List[UploadFile], session: AsyncSession, project_id: int | None = None
) -> List[FileResponse]:
    results: List[FileResponse] = []

    for upload in uploads:
        if not _is_pdf(upload):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"File '{upload.filename}' is not a PDF. Only PDF files are allowed.",
            )

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
            project_id=project_id,
        )
        session.add(record)
        await session.flush()  # populate record.id
        await session.commit()  # persist FileRecord before attempting indexing
        await session.refresh(record)

        try:
            text_content = await extractor.extract_text(data)
            if text_content.strip():
                await indexer.index_document(
                    session, record.id, record.filename, text_content
                )
        except Exception:
            pass  # Indexing is best-effort; file record is already saved

        results.append(FileResponse.model_validate(record))

    return results


async def list_files(session: AsyncSession) -> List[FileResponse]:
    rows = await session.execute(
        select(FileRecord).order_by(FileRecord.created_at.desc())
    )
    return [FileResponse.model_validate(r) for r in rows.scalars().all()]


async def delete_file(file_id: int, session: AsyncSession) -> None:
    result = await session.execute(select(FileRecord).where(FileRecord.id == file_id))
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File {file_id} not found.",
        )
    await session.delete(record)
    await session.execute(
        text("DELETE FROM documents_fts WHERE file_id = :fid"),
        {"fid": file_id},
    )
    await session.commit()
