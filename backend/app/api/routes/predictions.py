"""Single-prediction and model-info endpoints."""

from fastapi import APIRouter, HTTPException

from app.ml.feature_validation import FaultFeatures
from app.ml.model_loader import get_model_info, is_model_ready
from app.ml.predictor import predict
from app.schemas.prediction import (
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
)

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("", response_model=PredictionResponse)
async def create_prediction(body: PredictionRequest):
    if not is_model_ready():
        raise HTTPException(
            status_code=503,
            detail="Fault classification model is not available",
        )
    try:
        features = FaultFeatures(
            Ia=body.Ia, Ib=body.Ib, Ic=body.Ic,
            Va=body.Va, Vb=body.Vb, Vc=body.Vc,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        result = predict(features)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Prediction failed") from exc

    return result


@router.get("/model", response_model=ModelInfoResponse)
async def model_info():
    return get_model_info()
