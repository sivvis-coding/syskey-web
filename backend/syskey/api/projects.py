"""API router — project management."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from syskey.db.database import get_session
from syskey.db.models import Project, ProjectKeyword

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────


class ProjectCreate(BaseModel):
    name: str


class ProjectKeywordsUpdate(BaseModel):
    keywords: List[str]


class ProjectResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    keywords: List[str]

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, project: Project) -> "ProjectResponse":
        return cls(
            id=project.id,
            name=project.name,
            created_at=project.created_at,
            keywords=[kw.keyword for kw in project.keywords],
        )


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _get_project_or_404(project_id: int, session: AsyncSession) -> Project:
    result = await session.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.keywords))
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found."
        )
    return project


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/", response_model=List[ProjectResponse], summary="List all projects")
async def list_projects(
    session: AsyncSession = Depends(get_session),
) -> List[ProjectResponse]:
    result = await session.execute(
        select(Project)
        .options(selectinload(Project.keywords))
        .order_by(Project.created_at.desc())
    )
    return [ProjectResponse.from_orm(p) for p in result.scalars().all()]


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
    name = body.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Project name cannot be empty.",
        )

    project = Project(name=name)
    session.add(project)
    await session.commit()
    await session.refresh(project)
    # Reload with keywords relationship
    project = await _get_project_or_404(project.id, session)
    return ProjectResponse.from_orm(project)


@router.get("/{project_id}", response_model=ProjectResponse, summary="Get a project")
async def get_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
) -> ProjectResponse:
    project = await _get_project_or_404(project_id, session)
    return ProjectResponse.from_orm(project)


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
    project = await _get_project_or_404(project_id, session)

    # Replace all keywords
    for kw in list(project.keywords):
        await session.delete(kw)
    await session.flush()

    seen: set[str] = set()
    for raw in body.keywords:
        word = raw.strip().lower()
        if word and word not in seen:
            session.add(ProjectKeyword(project_id=project.id, keyword=word))
            seen.add(word)

    await session.commit()
    project = await _get_project_or_404(project_id, session)
    return ProjectResponse.from_orm(project)


@router.delete(
    "/{project_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a project"
)
async def delete_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    project = await _get_project_or_404(project_id, session)
    await session.delete(project)
    await session.commit()
