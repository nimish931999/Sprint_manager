import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.logging import setup_logging, get_logger
from app.core.database import init_db
from app.api.routes import auth, projects, tasks, dashboard

setup_logging()
logger = get_logger(__name__)

app = FastAPI(title="Sprint Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    start = time.perf_counter()

    # Init DB lazily (required for Vercel serverless)
    try:
        await init_db()
    except Exception as exc:
        logger.error("DB init failed: %s", exc, exc_info=True)
        return JSONResponse(status_code=503, content={"detail": "Database unavailable"})

    logger.info("→ %s %s", request.method, request.url.path)

    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    duration_ms = (time.perf_counter() - start) * 1000
    logger.info("← %s %s %d (%.1fms)", request.method, request.url.path, response.status_code, duration_ms)

    return response


app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str) -> JSONResponse:
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
            "Access-Control-Max-Age": "86400",
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
