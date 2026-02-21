"""CLI entry point — starts the FastAPI server and opens the browser."""

import time
import webbrowser

import typer
import uvicorn
from rich.console import Console

app = typer.Typer(
    name="syskey-web",
    help="Document search and tagging — starts the web interface.",
    add_completion=False,
)
console = Console()

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000


@app.command()
def main(
    host: str = typer.Option(DEFAULT_HOST, "--host", "-h", help="Host to bind to."),
    port: int = typer.Option(DEFAULT_PORT, "--port", "-p", help="Port to listen on."),
    no_browser: bool = typer.Option(False, "--no-browser", help="Do not open the browser."),
    reload: bool = typer.Option(False, "--reload", help="Enable auto-reload (development mode)."),
    log_level: str = typer.Option("info", "--log-level", help="Uvicorn log level."),
) -> None:
    """Start the syskey-web server and open the browser."""
    url = f"http://{host}:{port}"

    console.rule("[bold cyan]syskey-web[/bold cyan]")
    console.print(f"[green]✔[/green]  Starting server at [bold]{url}[/bold]")
    console.print("[dim]Press Ctrl+C to stop.[/dim]\n")

    if not no_browser:
        # Open browser after a short delay so the server is ready
        def _open() -> None:
            time.sleep(1.5)
            webbrowser.open(url)

        import threading
        threading.Thread(target=_open, daemon=True).start()

    uvicorn.run(
        "syskey.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level,
    )
