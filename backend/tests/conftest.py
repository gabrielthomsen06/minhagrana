import os

import bcrypt
import pytest

os.environ["ADMIN_USERNAME"] = "testuser"
os.environ["ADMIN_PASSWORD_HASH"] = bcrypt.hashpw(b"testpass", bcrypt.gensalt()).decode()
os.environ["SECRET_KEY"] = "chave-de-teste-nao-usar-em-producao"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c
