import secrets

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.security import create_access_token, verify_password

router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str


@router.post("/auth/login", response_model=LoginResponse)
def login(data: LoginRequest):
    username_ok = secrets.compare_digest(
        data.username.encode(), settings.admin_username.encode()
    )
    password_ok = verify_password(data.password, settings.admin_password_hash)
    if not (username_ok and password_ok):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    return LoginResponse(token=create_access_token(data.username), username=data.username)
