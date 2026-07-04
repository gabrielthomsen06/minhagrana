def _login_token(client):
    resp = client.post("/api/auth/login", json={"username": "testuser", "password": "testpass"})
    return resp.json()["token"]


def test_protected_route_without_token(client):
    resp = client.get("/api/categories")
    assert resp.status_code == 401


def test_protected_route_with_invalid_token(client):
    resp = client.get("/api/categories", headers={"Authorization": "Bearer token-falso"})
    assert resp.status_code == 401


def test_protected_route_with_valid_token(client):
    token = _login_token(client)
    resp = client.get("/api/categories", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


def test_login_stays_public(client):
    resp = client.post("/api/auth/login", json={"username": "x", "password": "y"})
    assert resp.status_code == 401  # credencial errada, não bloqueio de auth
