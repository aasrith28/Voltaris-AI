"""Aggregate API router under /api/v1."""

from fastapi import APIRouter

from app.api.routes import analyses, auth, health, predictions

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(predictions.router)
api_router.include_router(analyses.router)
