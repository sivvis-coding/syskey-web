"""Router (controller) — projects feature."""

from typing import List

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.shared.database import get_session
from syskey.features.projects.projects_schemas import (
    ProjectCreate,
    ProjectKeywordsUpdate,
    ProjectResponse,
)
from syskey.features.projects.analysis_schemas import AnalysisResponse
import syskey.features.projects.projects_service as service
import syskey.features.projects.analysis_service as analysis_service
import syskey.features.projects.classification_service as classification_service

router = APIRouter()


@router.get("/", response_model=List[ProjectResponse], summary="List all projects")
async def list_projects(
    session: AsyncSession = Depends(get_session),
) -> List[ProjectResponse]:
    return await service.list_projects(session)


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
)
async def create_project(
    body: ProjectCreate,
    session: AsyncSession = Depends(get_session),
) -> ProjectResponse:
    return await service.create_project(body.name, session)


@router.get("/{project_id}", response_model=ProjectResponse, summary="Get a project")
async def get_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
) -> ProjectResponse:
    return await service.get_project(project_id, session)


@router.put(
    "/{project_id}/keywords",
    response_model=ProjectResponse,
    summary="Replace the keyword list for a project",
)
async def update_keywords(
    project_id: int,
    body: ProjectKeywordsUpdate,
    session: AsyncSession = Depends(get_session),
) -> ProjectResponse:
    return await service.update_keywords(project_id, body.keywords, session)


@router.delete(
    "/{project_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a project"
)
async def delete_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    await service.delete_project(project_id, session)


@router.get(
    "/{project_id}/analysis",
    response_model=AnalysisResponse,
    summary="Get the last saved analysis for a project",
)
async def get_analysis(
    project_id: int,
    session: AsyncSession = Depends(get_session),
) -> AnalysisResponse:
    """Returns the last saved analysis result, or an empty response if never run."""
    saved = await analysis_service.get_saved_analysis(project_id, session)
    if saved is not None:
        return saved
    return AnalysisResponse(project_id=project_id, rows=[], analyzed_at=None)


@router.post(
    "/{project_id}/analysis",
    response_model=AnalysisResponse,
    summary="Run analysis and save the results",
)
async def run_analysis(
    project_id: int,
    session: AsyncSession = Depends(get_session),
) -> AnalysisResponse:
    """Runs keyword × file analysis, persists the result, and returns it."""
    return await analysis_service.run_and_save_analysis(project_id, session)


@router.get(
    "/{project_id}/classification/export/matched",
    summary="Download ZIP of files with at least one keyword match",
)
async def export_matched(
    project_id: int,
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    data = await classification_service.export_zip(
        project_id, matched=True, session=session
    )
    return StreamingResponse(
        iter([data]),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=matched_{project_id}.zip"
        },
    )


@router.get(
    "/{project_id}/classification/export/unmatched",
    summary="Download ZIP of files with no keyword matches",
)
async def export_unmatched(
    project_id: int,
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    data = await classification_service.export_zip(
        project_id, matched=False, session=session
    )
    return StreamingResponse(
        iter([data]),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=unmatched_{project_id}.zip"
        },
    )
