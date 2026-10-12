"""Controlled loading of the Random Forest fault classifier."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Optional

import joblib

from app.config import get_settings

logger = logging.getLogger(__name__)

EXPECTED_FEATURES = ["Ia", "Ib", "Ic", "Va", "Vb", "Vc"]
EXPECTED_CLASSES = ["ABC", "ABCG", "ABG", "AG", "BC", "No Fault"]

# Global model reference — loaded once at startup
_model: Optional[Any] = None
_model_loaded: bool = False
_load_error: Optional[str] = None


def load_model() -> None:
    """Load the pickle artifact. Call once during application startup."""
    global _model, _model_loaded, _load_error

    settings = get_settings()
    path = Path(settings.model_path)

    if not path.is_file():
        _load_error = f"Model file not found at {path}"
        logger.error(_load_error)
        _model_loaded = False
        return

    try:
        model = joblib.load(path)
        n_features = getattr(model, "n_features_in_", None)
        classes = list(getattr(model, "classes_", []))

        if n_features != 6:
            raise ValueError(
                f"Model expects {n_features} features; application requires 6 "
                f"({EXPECTED_FEATURES})"
            )
        if set(classes) != set(EXPECTED_CLASSES):
            logger.warning(
                "Model classes %s differ from expected %s", classes, EXPECTED_CLASSES
            )

        _model = model
        _model_loaded = True
        _load_error = None
        logger.info(
            "Model loaded from %s | features=%s | classes=%s | version=%s",
            path,
            n_features,
            classes,
            settings.model_version,
        )
    except Exception as exc:
        _load_error = str(exc)
        _model = None
        _model_loaded = False
        logger.exception("Failed to load model: %s", exc)


def get_model() -> Any:
    """Return the loaded model or raise if unavailable."""
    if not _model_loaded or _model is None:
        raise RuntimeError(
            _load_error or "Model is not loaded. Check MODEL_PATH and restart."
        )
    return _model


def is_model_ready() -> bool:
    return _model_loaded and _model is not None


def get_load_error() -> Optional[str]:
    return _load_error


def get_model_info() -> dict:
    settings = get_settings()
    info: dict = {
        "ready": is_model_ready(),
        "version": settings.model_version,
        "path": settings.model_path,
        "expected_features": EXPECTED_FEATURES,
        "expected_classes": EXPECTED_CLASSES,
        "error": _load_error,
    }
    if is_model_ready() and _model is not None:
        info["n_features"] = getattr(_model, "n_features_in_", None)
        info["classes"] = list(getattr(_model, "classes_", []))
        info["estimator"] = type(_model).__name__
    return info
