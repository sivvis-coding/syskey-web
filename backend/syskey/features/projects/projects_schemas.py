"""Pydantic schemas — projects feature."""

from datetime import datetime
from typing import List

from pydantic import BaseModel

from syskey.features.projects.projects_models import Project


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
