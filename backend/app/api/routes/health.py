"""Health and readiness endpoints."""

from fastapi import APIRouter

from app.config import get_settings
from app.ml.model_loader import get_model_info, is_model_ready

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": get_settings().app_name,
        "model_ready": is_model_ready(),
    }


@router.get("/ready")
async def ready():
    info = get_model_info()
    status = "ready" if info["ready"] else "not_ready"
    return {"status": status, "model": info}
