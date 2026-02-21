"""ORM models — files feature."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from syskey.shared.database import Base


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
