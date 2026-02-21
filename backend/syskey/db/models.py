"""SQLAlchemy ORM models."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from syskey.db.database import Base


# ── Projects ──────────────────────────────────────────────────────────────────


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


class ProjectKeyword(Base):
    __tablename__ = "project_keywords"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    keyword = Column(String(256), nullable=False)

    project = relationship("Project", back_populates="keywords")


# ── Files ─────────────────────────────────────────────────────────────────────


class FileRecord(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(512), nullable=False)
    content_type = Column(String(256), nullable=True)
    size_bytes = Column(Integer, nullable=False, default=0)
    storage_path = Column(String(1024), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)

    tags = relationship(
        "TagRecord", back_populates="file", cascade="all, delete-orphan"
    )


class TagRecord(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, index=True)
    tag = Column(String(256), nullable=False)

    file = relationship("FileRecord", back_populates="tags")
