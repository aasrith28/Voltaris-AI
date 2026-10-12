"""Prediction endpoint and model contract tests."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ml.model_loader import load_model, is_model_ready


@pytest.fixture(scope="module", autouse=True)
def _ensure_model():
    load_model()


client = TestClient(app)


def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["model_ready"] is True


def test_model_info():
    r = client.get("/api/v1/predictions/model")
    assert r.status_code == 200
    body = r.json()
    assert body["ready"] is True
    assert body["n_features"] == 6
    assert set(body["classes"]) == {
        "ABC",
        "ABCG",
        "ABG",
        "AG",
        "BC",
        "No Fault",
    }


def test_valid_prediction():
    payload = {
        "Ia": 55.5,
        "Ib": -1.2,
        "Ic": -54.3,
        "Va": 0.4,
        "Vb": -0.2,
        "Vc": -0.2,
    }
    r = client.post("/api/v1/predictions", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["fault_type"] in {
        "ABC",
        "ABCG",
        "ABG",
        "AG",
        "BC",
        "No Fault",
    }
    assert "confidence" in body
    assert "class_scores" in body
    assert "phase_status" in body
    assert body["model_version"]


def test_missing_feature():
    r = client.post("/api/v1/predictions", json={"Ia": 1, "Ib": 1})
    assert r.status_code == 422


def test_out_of_range_current():
    payload = {
        "Ia": 5000,
        "Ib": 0,
        "Ic": 0,
        "Va": 0,
        "Vb": 0,
        "Vc": 0,
    }
    r = client.post("/api/v1/predictions", json=payload)
    # Pydantic validation on FaultFeatures inside route may return 422
    assert r.status_code in (422, 400)
