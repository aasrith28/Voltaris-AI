"""Saved analysis history endpoints (authenticated, ownership enforced)."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.ml.feature_validation import FaultFeatures
from app.ml.model_loader import is_model_ready
from app.ml.predictor import predict
from app.models import Analysis
from app.services import authentication as auth_svc

router = APIRouter(prefix="/analyses", tags=["analyses"])
settings = get_settings()


class AnalysisCreate(BaseModel):
    Ia: float
    Ib: float
    Ic: float
    Va: float
    Vb: float
    Vc: float
    notes: Optional[str] = Field(None, max_length=500)


class AnalysisOut(BaseModel):
    id: str
    Ia: float
    Ib: float
    Ic: float
    Va: float
    Vb: float
    Vc: float
    fault_type: str
    fault_label: str
    confidence: float
    model_version: str
    notes: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


async def require_user(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await auth_svc.get_session_user(db, token, allow_pre_auth=False)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    user, _ = result
    return user


@router.post("", response_model=AnalysisOut, status_code=201)
async def create_analysis(
    body: AnalysisCreate,
    user=Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    if not is_model_ready():
        raise HTTPException(status_code=503, detail="Model unavailable")
    try:
        features = FaultFeatures(
            Ia=body.Ia, Ib=body.Ib, Ic=body.Ic,
            Va=body.Va, Vb=body.Vb, Vc=body.Vc,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    result = predict(features)
    record = Analysis(
        user_id=user.id,
        Ia=body.Ia,
        Ib=body.Ib,
        Ic=body.Ic,
        Va=body.Va,
        Vb=body.Vb,
        Vc=body.Vc,
        fault_type=result["fault_type"],
        fault_label=result["fault_label"],
        confidence=result["confidence"],
        model_version=result["model_version"],
        notes=body.notes,
    )
    db.add(record)
    await db.flush()
    return AnalysisOut(
        id=record.id,
        Ia=record.Ia,
        Ib=record.Ib,
        Ic=record.Ic,
        Va=record.Va,
        Vb=record.Vb,
        Vc=record.Vc,
        fault_type=record.fault_type,
        fault_label=record.fault_label,
        confidence=record.confidence,
        model_version=record.model_version,
        notes=record.notes,
        created_at=record.created_at.isoformat(),
    )


@router.get("", response_model=List[AnalysisOut])
async def list_analyses(
    user=Depends(require_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    q = (
        select(Analysis)
        .where(Analysis.user_id == user.id)
        .order_by(Analysis.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await db.execute(q)).scalars().all()
    return [
        AnalysisOut(
            id=r.id,
            Ia=r.Ia,
            Ib=r.Ib,
            Ic=r.Ic,
            Va=r.Va,
            Vb=r.Vb,
            Vc=r.Vc,
            fault_type=r.fault_type,
            fault_label=r.fault_label,
            confidence=r.confidence,
            model_version=r.model_version,
            notes=r.notes,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]


@router.get("/{analysis_id}", response_model=AnalysisOut)
async def get_analysis(
    analysis_id: str,
    user=Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(Analysis, analysis_id)
    if not record or record.user_id != user.id:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return AnalysisOut(
        id=record.id,
        Ia=record.Ia,
        Ib=record.Ib,
        Ic=record.Ic,
        Va=record.Va,
        Vb=record.Vb,
        Vc=record.Vc,
        fault_type=record.fault_type,
        fault_label=record.fault_label,
        confidence=record.confidence,
        model_version=record.model_version,
        notes=record.notes,
        created_at=record.created_at.isoformat(),
    )


@router.delete("/{analysis_id}", status_code=204)
async def delete_analysis(
    analysis_id: str,
    user=Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(Analysis, analysis_id)
    if not record or record.user_id != user.id:
        raise HTTPException(status_code=404, detail="Analysis not found")
    await db.delete(record)
    await db.flush()
