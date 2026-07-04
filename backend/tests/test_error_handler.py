from fastapi.testclient import TestClient

from app.main import app


def test_unhandled_exception_returns_generic_500():
    @app.get("/api/_boom")
    def boom():
        raise RuntimeError("segredo interno")

    with TestClient(app, raise_server_exceptions=False) as c:
        resp = c.get("/api/_boom")
    assert resp.status_code == 500
    assert resp.json() == {"detail": "Erro interno do servidor"}
    assert "segredo interno" not in resp.text
