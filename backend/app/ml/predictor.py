"""Single documented prediction service for the fault classifier."""

from __future__ import annotations

from typing import Any, Dict, List

import pandas as pd

from app.config import get_settings
from app.ml.feature_validation import FaultFeatures
from app.ml.model_loader import EXPECTED_FEATURES, get_model, is_model_ready

# Phase/ground status derived from predicted class labels (domain mapping).
FAULT_INFO: Dict[str, Dict[str, Any]] = {
    "No Fault": {
        "label": "No Fault — healthy operation",
        "A": False,
        "B": False,
        "C": False,
        "ground": False,
        "description": (
            "No fault condition detected. Currents and voltages are consistent "
            "with normal three-phase operation."
        ),
    },
    "AG": {
        "label": "Line A to Ground fault",
        "A": True,
        "B": False,
        "C": False,
        "ground": True,
        "description": (
            "Single line-to-ground fault involving phase A and ground. "
            "Phase A current is elevated; ground return path is active."
        ),
    },
    "BC": {
        "label": "Line B to Line C fault",
        "A": False,
        "B": True,
        "C": True,
        "ground": False,
        "description": (
            "Phase-to-phase fault between B and C. No ground involvement. "
            "Phases B and C show abnormal current magnitudes."
        ),
    },
    "ABG": {
        "label": "Line A, B to Ground fault",
        "A": True,
        "B": True,
        "C": False,
        "ground": True,
        "description": (
            "Double line-to-ground fault involving phases A and B with ground. "
            "Phases A and B are faulted; ground path is active."
        ),
    },
    "ABC": {
        "label": "Three-Phase fault",
        "A": True,
        "B": True,
        "C": True,
        "ground": False,
        "description": (
            "Symmetric three-phase fault without ground involvement. "
            "All three phases are affected. Note: the model may confuse ABC "
            "with ABCG due to similar instantaneous signatures."
        ),
    },
    "ABCG": {
        "label": "Three-Phase to Ground fault",
        "A": True,
        "B": True,
        "C": True,
        "ground": True,
        "description": (
            "Three-phase fault with ground involvement. All phases and ground "
            "are faulted. Distinguishing ABC from ABCG is known to be difficult "
            "for this feature set."
        ),
    },
}


def predict(features: FaultFeatures) -> Dict[str, Any]:
    """Run inference and return a structured, documented response.

    Does not claim that predict_proba values are calibrated probabilities.
    Confidence is the maximum class score returned by the classifier.
    """
    if not is_model_ready():
        raise RuntimeError("Model is not available")

    model = get_model()
    settings = get_settings()
    input_df = pd.DataFrame([features.as_list()], columns=EXPECTED_FEATURES)

    prediction = model.predict(input_df)[0]
    probabilities = model.predict_proba(input_df)[0]
    class_list = list(model.classes_)

    confidence = float(max(probabilities))
    proba_map = {
        str(cls): round(float(prob), 4) for cls, prob in zip(class_list, probabilities)
    }

    info = FAULT_INFO.get(
        prediction,
        {
            "label": str(prediction),
            "A": False,
            "B": False,
            "C": False,
            "ground": False,
            "description": "Unknown class",
        },
    )

    return {
        "fault_type": str(prediction),
        "fault_label": info["label"],
        "description": info["description"],
        "confidence": round(confidence, 4),
        "class_scores": proba_map,
        "phase_status": {
            "A": info["A"],
            "B": info["B"],
            "C": info["C"],
            "ground": info["ground"],
        },
        "model_version": settings.model_version,
        "features_used": features.as_list(),
        "disclaimer": (
            "This is a model prediction for educational purposes. "
            "It is not a substitute for qualified engineering judgment or "
            "protection-device decisions."
        ),
    }
