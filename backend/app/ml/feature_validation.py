"""Validate prediction inputs against the model feature contract."""

from typing import List

from pydantic import BaseModel, Field, field_validator


class FaultFeatures(BaseModel):
    """Six electrical features expected by the Random Forest classifier.

    Current values (Ia, Ib, Ic) are in the same units as the training data
    (roughly -900 to 900). Voltage values (Va, Vb, Vc) are normalized
    (approximately -0.65 to 0.65) as provided by the source dataset.
    """

    Ia: float = Field(..., description="Phase A current")
    Ib: float = Field(..., description="Phase B current")
    Ic: float = Field(..., description="Phase C current")
    Va: float = Field(..., description="Phase A voltage (normalized)")
    Vb: float = Field(..., description="Phase B voltage (normalized)")
    Vc: float = Field(..., description="Phase C voltage (normalized)")

    @field_validator("Ia", "Ib", "Ic")
    @classmethod
    def current_range(cls, v: float) -> float:
        if not -2000 <= v <= 2000:
            raise ValueError("Current must be between -2000 and 2000")
        return v

    @field_validator("Va", "Vb", "Vc")
    @classmethod
    def voltage_range(cls, v: float) -> float:
        if not -2.0 <= v <= 2.0:
            raise ValueError("Normalized voltage must be between -2.0 and 2.0")
        return v

    def as_list(self) -> List[float]:
        """Return features in the exact order expected by the model."""
        return [self.Ia, self.Ib, self.Ic, self.Va, self.Vb, self.Vc]
