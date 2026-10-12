"""Shared pytest fixtures — ensure DB schema and model are ready."""

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app
from app.ml.model_loader import load_model


@pytest.fixture(scope="session", autouse=True)
def setup_app():
    load_model()
    # Create tables synchronously for tests
    import asyncio

    async def _create():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.get_event_loop().run_until_complete(_create())
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
