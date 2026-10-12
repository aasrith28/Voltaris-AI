"""Authentication flow smoke tests."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_register_and_verify_and_login():
    email = "testuser@example.com"
    password = "SecurePass1x"

    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert "dev_verification_token" in body
    token = body["dev_verification_token"]

    r2 = client.post("/api/v1/auth/verify-email", json={"token": token})
    assert r2.status_code == 200, r2.text

    r3 = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert r3.status_code == 200, r3.text
    login = r3.json()
    # New user: 2FA not yet enabled
    assert login.get("requires_2fa") is False
    assert "user" in login


def test_login_invalid_credentials():
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "WrongPass1x"},
    )
    assert r.status_code == 401
