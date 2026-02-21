"""Service — files business logic."""

import mimetypes
from typing import List

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.features.files.files_models import FileRecord
from syskey.features.files.files_schemas import FileResponse
from syskey.features.files import files_storage as storage, files_indexer as indexer


async def upload_files(
    uploads: List[UploadFile], session: AsyncSession
) -> List[FileResponse]:
    results: List[FileResponse] = []

    for upload in uploads:
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

        try:
            text_content = data.decode("utf-8", errors="replace")
            await indexer.index_document(
                session, record.id, record.filename, text_content
            )
        except Exception:
            pass  # Non-text files are stored but not indexed

        await session.commit()
        await session.refresh(record)
        results.append(FileResponse.model_validate(record))

    return results


async def list_files(session: AsyncSession) -> List[FileResponse]:
    rows = await session.execute(
        select(FileRecord).order_by(FileRecord.created_at.desc())
    )
    return [FileResponse.model_validate(r) for r in rows.scalars().all()]
