from fastapi.testclient import TestClient

from app.main import app


@app.get("/api/_boom")
def boom():
    raise RuntimeError("segredo interno")


def test_unhandled_exception_returns_generic_500():
    with TestClient(app, raise_server_exceptions=False) as c:
        resp = c.get("/api/_boom")
    assert resp.status_code == 500
    assert resp.json() == {"detail": "Erro interno do servidor"}
    assert "segredo interno" not in resp.text


def test_unhandled_exception_includes_cors_headers_for_allowed_origin():
    with TestClient(app, raise_server_exceptions=False) as c:
        resp = c.get("/api/_boom", headers={"Origin": "http://localhost:5173"})
    assert resp.status_code == 500
    assert resp.json() == {"detail": "Erro interno do servidor"}
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert resp.headers.get("access-control-allow-credentials") == "true"
