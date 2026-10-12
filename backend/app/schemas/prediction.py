"""Pydantic schemas for prediction endpoints."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    Ia: float = Field(..., description="Phase A current")
    Ib: float = Field(..., description="Phase B current")
    Ic: float = Field(..., description="Phase C current")
    Va: float = Field(..., description="Phase A voltage (normalized)")
    Vb: float = Field(..., description="Phase B voltage (normalized)")
    Vc: float = Field(..., description="Phase C voltage (normalized)")


class PhaseStatus(BaseModel):
    A: bool
    B: bool
    C: bool
    ground: bool


class PredictionResponse(BaseModel):
    fault_type: str
    fault_label: str
    description: str
    confidence: float
    class_scores: Dict[str, float]
    phase_status: PhaseStatus
    model_version: str
    features_used: List[float]
    disclaimer: str


class ModelInfoResponse(BaseModel):
    ready: bool
    version: str
    path: str
    expected_features: List[str]
    expected_classes: List[str]
    error: Optional[str] = None
    n_features: Optional[int] = None
    classes: Optional[List[str]] = None
    estimator: Optional[str] = None
