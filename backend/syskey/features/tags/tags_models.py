"""ORM models — tags feature."""

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from syskey.shared.database import Base


class TagRecord(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, index=True)
    tag = Column(String(256), nullable=False)

    file = relationship("FileRecord", back_populates="tags")
