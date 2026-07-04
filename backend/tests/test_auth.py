def test_login_success(client):
    resp = client.post("/api/auth/login", json={"username": "testuser", "password": "testpass"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["username"] == "testuser"
    assert len(body["token"]) > 20


def test_login_wrong_password(client):
    resp = client.post("/api/auth/login", json={"username": "testuser", "password": "errada"})
    assert resp.status_code == 401


def test_login_wrong_username(client):
    resp = client.post("/api/auth/login", json={"username": "outro", "password": "testpass"})
    assert resp.status_code == 401
