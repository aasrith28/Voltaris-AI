
"""Voltaris AI FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import get_settings
from app.database import Base, engine
from app.ml.model_loader import load_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("voltaris")

FRONTEND_ORIGINS = [
    "https://voltaris-ai-nine.vercel.app",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting %s (%s)", settings.app_name, settings.app_env)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database schema ensured")
    load_model()

    yield

    logger.info("Shutting down")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description=(
            "Voltaris AI: An Intelligent Web-Based Three-Phase Electrical "
            "Fault Diagnosis and Analysis System"
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # Include the deployed Vercel frontend and existing configured origins.
    configured_origins = list(settings.cors_origin_list)
    origins = list(dict.fromkeys(configured_origins + FRONTEND_ORIGINS))

    if not settings.is_production and settings.debug:
        for origin in (
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ):
            if origin not in origins:
                origins.append(origin)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    @app.get("/")
    async def root():
        return {
            "name": settings.app_name,
            "title": (
                "Voltaris AI: An Intelligent Web-Based Three-Phase "
                "Electrical Fault Diagnosis and Analysis System"
            ),
            "tagline": "Understand Every Fault. Analyse Every Phase.",
            "docs": "/api/docs",
            "health": "/api/v1/health",
        }

    return app


app = create_app()
