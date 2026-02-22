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

        # Incremental migrations: add columns that may be missing from older DBs
        existing_cols_result = await conn.execute(text("PRAGMA table_info(files)"))
        existing_cols = {row[1] for row in existing_cols_result.fetchall()}
        if "project_id" not in existing_cols:
            await conn.execute(
                text(
                    "ALTER TABLE files ADD COLUMN project_id INTEGER REFERENCES projects(id)"
                )
            )
            await conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_files_project_id ON files (project_id)"
                )
            )

        # Analysis cache table — stores the last computed analysis per project
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS analysis_cache (
                    project_id  INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
                    rows_json   TEXT NOT NULL,
                    snapshot_json TEXT NOT NULL DEFAULT '{}',
                    analyzed_at DATETIME NOT NULL
                )
                """
            )
        )
        # Incremental migration: add snapshot_json if missing (older schema)
        cache_cols_result = await conn.execute(
            text("PRAGMA table_info(analysis_cache)")
        )
        cache_cols = {row[1] for row in cache_cols_result.fetchall()}
        if "snapshot_json" not in cache_cols:
            await conn.execute(
                text(
                    "ALTER TABLE analysis_cache ADD COLUMN snapshot_json TEXT NOT NULL DEFAULT '{}'"
                )
            )
