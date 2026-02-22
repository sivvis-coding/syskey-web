"""ORM models — projects feature."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from syskey.shared.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    keywords = relationship(
        "ProjectKeyword",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectKeyword.id",
    )

    files = relationship(
        "FileRecord",
        foreign_keys="FileRecord.project_id",
        back_populates="project",
        order_by="FileRecord.id",
    )


class ProjectKeyword(Base):
    __tablename__ = "project_keywords"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    keyword = Column(String(256), nullable=False)

    project = relationship("Project", back_populates="keywords")
