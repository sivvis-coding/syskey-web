"""SQLite database setup with SQLAlchemy (async)."""

from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Store the database in the user's home directory so it persists across installs
DB_PATH = Path.home() / ".syskey" / "syskey.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

engine: AsyncEngine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal: sessionmaker = sessionmaker(  # type: ignore[call-overload]
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:  # type: ignore[return]
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """Create all tables and the FTS5 virtual table.

    All feature model modules must be imported before this is called so that
    their tables are registered on Base.metadata.
    """
    async with engine.begin() as conn:
        # Create ORM-mapped tables
        await conn.run_sync(Base.metadata.create_all)

        # Create FTS5 virtual table for full-text search (if not exists)
        await conn.execute(
            text(
                """
                CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
                    file_id UNINDEXED,
                    filename,
                    content,
                    tokenize='unicode61'
                )
                """
            )
        )
