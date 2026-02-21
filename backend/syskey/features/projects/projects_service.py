"""Service — projects business logic."""

from typing import List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from syskey.features.projects.projects_models import Project, ProjectKeyword
from syskey.features.projects.projects_schemas import ProjectResponse


async def get_project_or_404(project_id: int, session: AsyncSession) -> Project:
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


async def list_projects(session: AsyncSession) -> List[ProjectResponse]:
    result = await session.execute(
        select(Project)
        .options(selectinload(Project.keywords))
        .order_by(Project.created_at.desc())
    )
    return [ProjectResponse.from_orm(p) for p in result.scalars().all()]


async def create_project(name: str, session: AsyncSession) -> ProjectResponse:
    name = name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Project name cannot be empty.",
        )
    project = Project(name=name)
    session.add(project)
    await session.commit()
    await session.refresh(project)
    project = await get_project_or_404(project.id, session)
    return ProjectResponse.from_orm(project)


async def get_project(project_id: int, session: AsyncSession) -> ProjectResponse:
    project = await get_project_or_404(project_id, session)
    return ProjectResponse.from_orm(project)


async def update_keywords(
    project_id: int, keywords: List[str], session: AsyncSession
) -> ProjectResponse:
    project = await get_project_or_404(project_id, session)

    for kw in list(project.keywords):
        await session.delete(kw)
    await session.flush()

    seen: set[str] = set()
    for raw in keywords:
        word = raw.strip().lower()
        if word and word not in seen:
            session.add(ProjectKeyword(project_id=project.id, keyword=word))
            seen.add(word)

    await session.commit()
    project = await get_project_or_404(project_id, session)
    return ProjectResponse.from_orm(project)


async def delete_project(project_id: int, session: AsyncSession) -> None:
    project = await get_project_or_404(project_id, session)
    await session.delete(project)
    await session.commit()
