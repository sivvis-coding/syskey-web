"""FastAPI application factory."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

from syskey.features.projects.projects_router import router as projects_router
from syskey.features.files.files_router import router as files_router
from syskey.features.search.search_router import router as search_router
from syskey.features.tags.tags_router import router as tags_router

# Import all model modules so Base.metadata is fully populated before init_db
import syskey.features.projects.projects_models  # noqa: F401
import syskey.features.files.files_models  # noqa: F401
import syskey.features.tags.tags_models  # noqa: F401
from syskey.shared.database import init_db

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(
    title="syskey-web",
    description="Bulk file upload, full-text search and document tagging.",
    version="0.1.0",
)

# ── API routes ────────────────────────────────────────────────────────────────
app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
app.include_router(files_router, prefix="/api/files", tags=["files"])
app.include_router(search_router, prefix="/api/search", tags=["search"])
app.include_router(tags_router, prefix="/api/tags", tags=["tags"])


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

else:

    @app.get("/", include_in_schema=False)
    async def dev_root() -> RedirectResponse:
        """In dev mode (no built frontend), redirect root to the API docs."""
        return RedirectResponse(url="/docs")
