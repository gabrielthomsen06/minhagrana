from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import hashlib
import secrets
import os

router = APIRouter()

# Credenciais configuráveis via .env (fallback para valores padrão)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "gabriel.andre")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Gta090306_")

# Token simples em memória (reinicia com o servidor)
active_tokens: set[str] = set()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str


@router.post("/auth/login", response_model=LoginResponse)
def login(data: LoginRequest):
    if data.username != ADMIN_USERNAME or data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    token = secrets.token_hex(32)
    active_tokens.add(token)
    return LoginResponse(token=token, username=data.username)


@router.post("/auth/verify")
def verify_token(token: str):
    if token not in active_tokens:
        raise HTTPException(status_code=401, detail="Token inválido")
    return {"valid": True}


@router.post("/auth/logout")
def logout(token: str):
    active_tokens.discard(token)
    return {"message": "Logout realizado com sucesso"}
