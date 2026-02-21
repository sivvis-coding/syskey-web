"""Router (controller) — projects feature."""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from syskey.shared.database import get_session
from syskey.features.projects.projects_schemas import (
    ProjectCreate,
    ProjectKeywordsUpdate,
    ProjectResponse,
)
import syskey.features.projects.projects_service as service

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
