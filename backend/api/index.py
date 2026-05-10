import sys
import os

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.main import app
except Exception as e:
    # If the app fails to import, create a minimal fallback app that reports the error
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    async def error_handler(path: str):
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "type": type(e).__name__},
            headers={"Access-Control-Allow-Origin": "*"},
        )
