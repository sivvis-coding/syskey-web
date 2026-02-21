"""FastAPI application factory."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from syskey.api import files, search, tags
from syskey.db.database import init_db

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(
    title="syskey-web",
    description="Bulk file upload, full-text search and document tagging.",
    version="0.1.0",
)

# ── API routes ────────────────────────────────────────────────────────────────
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup() -> None:
    await init_db()


# ── Serve compiled React frontend ─────────────────────────────────────────────
_assets_dir = STATIC_DIR / "assets"
if _assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        return FileResponse(str(STATIC_DIR / "index.html"))
