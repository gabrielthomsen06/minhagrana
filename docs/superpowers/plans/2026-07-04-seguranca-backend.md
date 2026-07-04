# Segurança Essencial + Fundação de Arquitetura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proteger todas as rotas de dados com JWT stateless, eliminar segredos do repositório, centralizar configuração e adotar migrações Alembic — deixando o backend pronto para deploy serverless (Vercel).

**Architecture:** Autenticação single-user com credenciais em variáveis de ambiente (senha como hash bcrypt), JWT HS256 com expiração de 7 dias validado por uma dependency `require_auth` aplicada no `include_router` de todos os routers de dados. Configuração via `pydantic-settings` (`app/config.py`). Schema do banco gerenciado por Alembic (o `create_all` do lifespan é removido).

**Tech Stack:** FastAPI 0.115, SQLAlchemy 2.0, pydantic-settings, PyJWT, bcrypt, Alembic, pytest, axios (frontend).

**Spec:** `docs/superpowers/specs/2026-07-04-seguranca-backend-design.md`

**Diretório de trabalho:** comandos do backend rodam a partir de `backend/` (o `.env` e o `alembic.ini` são resolvidos relativos ao cwd). O Python do projeto é `backend/venv/Scripts/python`.

---

## Contexto para quem nunca viu o repo

- Backend em `backend/app/`: `main.py` (app + CORS + routers), `database.py` (engine/Session), `models.py`, `schemas.py`, `routers/` com 10 routers. Todos os routers declaram `router = APIRouter(tags=[...])` e são montados em `main.py` com prefixo `/api`.
- `backend/app/routers/auth.py` hoje tem login com senha em texto puro hardcoded e tokens em memória. Será reescrito.
- Frontend em `frontend/`: React + Vite + axios. `frontend/src/services/api.ts` cria a instância axios (baseURL `/api`, proxy do Vite). `frontend/src/contexts/AuthContext.tsx` guarda `auth_token`/`auth_user` no localStorage. Quando não autenticado, `App.tsx` renderiza `<Login />` (não há rota `/login`) — portanto, para "redirecionar ao login" basta limpar o localStorage e recarregar a página.
- O bot do Telegram (`backend/bot/`) está FORA do escopo — não tocar.
- `backend/.env` está rastreado no git apesar de listado no `.gitignore` (foi commitado antes). Contém segredos vazados.

---

### Task 1: Higiene de repositório e segredos

**Files:**
- Modify: `.gitignore`
- Create: `backend/.env.example`
- Remove do índice git (mantendo no disco): `backend/.env`, `backend/app/routers/__pycache__/*.pyc`

- [ ] **Step 1: Reescrever o `.gitignore`**

Substituir o conteúdo de `.gitignore` por:

```gitignore
# Python
__pycache__/
*.pyc
backend/venv/
backend/.env
.pytest_cache/

# Frontend
frontend/node_modules/
frontend/package-lock.json
frontend/dist/
```

- [ ] **Step 2: Remover do índice o que já está rastreado**

Na raiz do repo:

```bash
git rm --cached backend/.env
git rm -r --cached backend/app/routers/__pycache__
```

Expected: git lista os arquivos como `rm`. Confirmar que os arquivos continuam no disco (`ls backend/.env` deve existir).

- [ ] **Step 3: Criar `backend/.env.example`**

```bash
# backend/.env.example
# Copie para .env e preencha os valores reais. NUNCA commite o .env.

DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/minhagrana

# Gere com: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=

ADMIN_USERNAME=
# Gere com: python -c "import bcrypt,getpass; print(bcrypt.hashpw(getpass.getpass('senha: ').encode(), bcrypt.gensalt()).decode())"
ADMIN_PASSWORD_HASH=

# Opcional — origens CORS como lista JSON (default: http://localhost:5173)
# CORS_ORIGINS=["http://localhost:5173","https://seu-app.vercel.app"]
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore backend/.env.example
git commit -m "chore: remove segredos e artefatos do versionamento"
```

- [ ] **Step 5: Avisar o usuário das ações manuais**

Lembrar o usuário (não bloqueia as próximas tasks): trocar a senha do PostgreSQL e revogar o token do bot no BotFather — os valores antigos permanecem no histórico do git.

---

### Task 2: Dependências novas + configuração central

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/app/config.py`
- Modify: `backend/app/database.py`
- Modify: `backend/.env` (local, não versionado)

- [ ] **Step 1: Adicionar dependências ao `requirements.txt`**

Acrescentar ao final de `backend/requirements.txt`:

```
pydantic-settings==2.6.1
PyJWT==2.10.1
bcrypt==4.2.1
alembic==1.14.0
pytest==8.3.4
```

- [ ] **Step 2: Instalar**

```bash
cd backend && venv/Scripts/python -m pip install -r requirements.txt
```

Expected: `Successfully installed ...` sem erros.

- [ ] **Step 3: Criar `backend/app/config.py`**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # ignora TELEGRAM_* e outras chaves não usadas
    )

    database_url: str
    secret_key: str
    admin_username: str
    admin_password_hash: str
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
```

Sem defaults para os campos sensíveis: se faltar variável, o app falha no import com erro claro de validação do pydantic.

- [ ] **Step 4: Atualizar o `.env` local do usuário**

O `.env` local precisa das novas chaves antes de qualquer teste rodar. Gerar a `SECRET_KEY`:

```bash
cd backend && venv/Scripts/python -c "import secrets; print(secrets.token_hex(32))"
```

Para a senha: **pausar e pedir ao usuário** que rode ele mesmo (para a senha nova não passar pela conversa):

```bash
cd backend && venv/Scripts/python -c "import bcrypt,getpass; print(bcrypt.hashpw(getpass.getpass('nova senha: ').encode(), bcrypt.gensalt()).decode())"
```

e cole no `.env` as linhas (mantendo `DATABASE_URL` e as demais existentes):

```
SECRET_KEY=<valor gerado>
ADMIN_USERNAME=<usuário escolhido>
ADMIN_PASSWORD_HASH=<hash colado pelo usuário>
```

- [ ] **Step 5: Reescrever `backend/app/database.py` para usar Settings**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

(O `load_dotenv` sai — `pydantic-settings` lê o `.env` diretamente.)

- [ ] **Step 6: Verificar que o app ainda sobe**

```bash
cd backend && venv/Scripts/python -c "from app.main import app; print('ok')"
```

Expected: `ok`. Se falhar com erro de validação do Settings, o `.env` está incompleto (voltar ao Step 4).

- [ ] **Step 7: Commit**

```bash
git add backend/requirements.txt backend/app/config.py backend/app/database.py
git commit -m "feat: configuracao central com pydantic-settings"
```

---

### Task 3: Módulo de segurança + login com JWT (TDD)

**Files:**
- Create: `backend/app/security.py`
- Rewrite: `backend/app/routers/auth.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Criar `backend/tests/conftest.py`**

As variáveis de ambiente têm precedência sobre o `.env` no pydantic-settings, então o conftest fixa credenciais de teste ANTES de importar o app. O `DATABASE_URL` continua vindo do `.env` local (os testes de rota protegida fazem uma leitura no banco de dev — precisa do Postgres local rodando).

```python
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
```

- [ ] **Step 2: Escrever os testes de login (que devem falhar)**

`backend/tests/test_auth.py`:

```python
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
```

- [ ] **Step 3: Rodar e confirmar falha**

```bash
cd backend && venv/Scripts/python -m pytest tests/test_auth.py -v
```

Expected: FAIL — `test_login_wrong_password` e `test_login_wrong_username` passam por acaso? Não: o auth.py atual compara com `ADMIN_USERNAME`/`ADMIN_PASSWORD` de `os.getenv` lidos no import; como o conftest define `ADMIN_USERNAME=testuser` mas `ADMIN_PASSWORD` não existe, o login de sucesso falha (401) → `test_login_success` FAIL. É o vermelho esperado.

- [ ] **Step 4: Criar `backend/app/security.py`**

```python
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

ALGORITHM = "HS256"
TOKEN_TTL = timedelta(days=7)

bearer_scheme = HTTPBearer(auto_error=False)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:
        return False


def create_access_token(username: str) -> str:
    payload = {"sub": username, "exp": datetime.now(timezone.utc) + TOKEN_TTL}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Não autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials, settings.secret_key, algorithms=[ALGORITHM]
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload["sub"]
```

- [ ] **Step 5: Reescrever `backend/app/routers/auth.py`**

Substituir TODO o conteúdo por:

```python
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
    username_ok = secrets.compare_digest(data.username, settings.admin_username)
    password_ok = verify_password(data.password, settings.admin_password_hash)
    if not (username_ok and password_ok):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    return LoginResponse(token=create_access_token(data.username), username=data.username)
```

Nota: `/auth/verify` e `/auth/logout` são removidos de propósito (spec §2). O frontend não os chama.

- [ ] **Step 6: Rodar os testes e confirmar verde**

```bash
cd backend && venv/Scripts/python -m pytest tests/test_auth.py -v
```

Expected: 3 passed.

- [ ] **Step 7: Commit**

```bash
git add backend/app/security.py backend/app/routers/auth.py backend/tests/
git commit -m "feat: autenticacao stateless com JWT e senha bcrypt"
```

---

### Task 4: Proteger todos os routers de dados (TDD)

**Files:**
- Create: `backend/tests/test_protected_routes.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Escrever os testes (que devem falhar)**

`backend/tests/test_protected_routes.py`:

```python
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
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
cd backend && venv/Scripts/python -m pytest tests/test_protected_routes.py -v
```

Expected: `test_protected_route_without_token` e `test_protected_route_with_invalid_token` FAIL (hoje retornam 200 — as rotas estão abertas).

- [ ] **Step 3: Aplicar `require_auth` em `backend/app/main.py`**

Substituir o bloco de `include_router` por:

```python
from fastapi import Depends
from app.security import require_auth

protected = [Depends(require_auth)]

app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api", dependencies=protected)
app.include_router(categories.router, prefix="/api", dependencies=protected)
app.include_router(banks.router, prefix="/api", dependencies=protected)
app.include_router(payment_methods.router, prefix="/api", dependencies=protected)
app.include_router(dashboard.router, prefix="/api", dependencies=protected)
app.include_router(export.router, prefix="/api", dependencies=protected)
app.include_router(annual_vision.router, prefix="/api", dependencies=protected)
app.include_router(credit_cards.router, prefix="/api", dependencies=protected)
app.include_router(investments.router, prefix="/api", dependencies=protected)
```

(Os imports `Depends` e `require_auth` vão para o topo do arquivo junto dos existentes.)

- [ ] **Step 4: Rodar TODOS os testes**

```bash
cd backend && venv/Scripts/python -m pytest tests -v
```

Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py backend/tests/test_protected_routes.py
git commit -m "feat: exige JWT em todas as rotas de dados"
```

---

### Task 5: Frontend — enviar token e tratar 401

**Files:**
- Modify: `frontend/src/services/api.ts` (logo após o `axios.create`)

- [ ] **Step 1: Adicionar interceptors em `api.ts`**

Logo após `const api = axios.create({ baseURL: '/api' })`, inserir:

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      // Token expirado ou inválido: volta para a tela de login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)
```

O 401 do próprio login NÃO recarrega a página — a tela de login mostra o erro normalmente. Após o reload, o `AuthContext` encontra o localStorage vazio e o `App.tsx` renderiza `<Login />`.

- [ ] **Step 2: Verificar tipos/build**

```bash
cd frontend && npm run build
```

Expected: build sem erros de TypeScript.

- [ ] **Step 3: Verificação manual do fluxo completo**

Subir backend (`cd backend && venv/Scripts/python -m uvicorn app.main:app --reload`) e frontend (preview do Vite), então:
1. Login com a senha nova → dashboard carrega dados (token sendo enviado).
2. No DevTools, apagar `auth_token` do localStorage e navegar → volta ao login.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat: interceptors de auth no axios (Bearer token + 401)"
```

---

### Task 6: Migrações com Alembic

**Files:**
- Create: `backend/alembic.ini`, `backend/alembic/` (via `alembic init`)
- Modify: `backend/alembic/env.py`
- Create: `backend/alembic/versions/<hash>_initial_schema.py` (autogerado)
- Modify: `backend/app/main.py` (remover `create_all`)

- [ ] **Step 1: Inicializar o Alembic**

```bash
cd backend && venv/Scripts/alembic init alembic
```

Expected: cria `backend/alembic.ini` e `backend/alembic/`.

- [ ] **Step 2: Configurar `backend/alembic/env.py`**

Logo após os imports existentes do env.py, adicionar:

```python
from app.config import settings
from app.database import Base
from app import models  # noqa: F401 — registra os modelos na metadata

config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))
```

E trocar a linha `target_metadata = None` por:

```python
target_metadata = Base.metadata
```

(O `replace("%", "%%")` protege contra senhas com `%`, que o configparser interpretaria.)

- [ ] **Step 3: Gerar a migração inicial contra um banco vazio temporário**

O banco de dev já tem todas as tabelas, então o autogenerate contra ele produziria uma migração vazia. Gerar contra um banco temporário vazio (a variável de ambiente `DATABASE_URL` tem precedência sobre o `.env`):

```bash
cd backend
venv/Scripts/python -c "import sqlalchemy as sa; from app.config import settings; url=sa.engine.make_url(settings.database_url).set(database='postgres'); e=sa.create_engine(url, isolation_level='AUTOCOMMIT'); e.connect().execute(sa.text('CREATE DATABASE minhagrana_alembic_tmp'))"
DATABASE_URL=$(venv/Scripts/python -c "import sqlalchemy as sa; from app.config import settings; print(sa.engine.make_url(settings.database_url).set(database='minhagrana_alembic_tmp'))") venv/Scripts/alembic revision --autogenerate -m "initial schema"
```

Expected: novo arquivo em `backend/alembic/versions/` com `create_table` para categories, banks, payment_methods, investment_accounts e transactions. Revisar o arquivo gerado.

- [ ] **Step 4: Validar a migração aplicando no banco temporário e descartá-lo**

```bash
cd backend
DATABASE_URL=$(venv/Scripts/python -c "import sqlalchemy as sa; from app.config import settings; print(sa.engine.make_url(settings.database_url).set(database='minhagrana_alembic_tmp'))") venv/Scripts/alembic upgrade head
venv/Scripts/python -c "import sqlalchemy as sa; from app.config import settings; url=sa.engine.make_url(settings.database_url).set(database='postgres'); e=sa.create_engine(url, isolation_level='AUTOCOMMIT'); e.connect().execute(sa.text('DROP DATABASE minhagrana_alembic_tmp'))"
```

Expected: `upgrade` roda sem erro; banco temporário removido.

- [ ] **Step 5: Marcar o banco de dev como migrado**

```bash
cd backend && venv/Scripts/alembic stamp head
```

Expected: cria a tabela `alembic_version` no banco de dev apontando para a revisão inicial. Nenhum dado é tocado.

- [ ] **Step 6: Remover o `create_all` do lifespan em `backend/app/main.py`**

Trocar:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield
```

por remover o lifespan inteiro e o import de `engine`/`Base`/`asynccontextmanager`, e simplificar:

```python
app = FastAPI(title="Minha Grana API")
```

- [ ] **Step 7: Rodar todos os testes**

```bash
cd backend && venv/Scripts/python -m pytest tests -v
```

Expected: 7 passed (as tabelas já existem no banco de dev; o TestClient não depende mais do create_all).

- [ ] **Step 8: Commit**

```bash
git add backend/alembic.ini backend/alembic backend/app/main.py
git commit -m "feat: migracoes com alembic; remove create_all do startup"
```

---

### Task 7: Handler global de erros + verificação final

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: Adicionar o exception handler em `main.py`**

Após a criação do `app` e antes do CORS, adicionar (com os imports no topo):

```python
import logging

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("minhagrana")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor"})
```

`HTTPException` continua com o handler padrão do FastAPI (não passa por aqui); somente exceções não tratadas viram 500 genérico, com o stack trace indo para o log do servidor em vez da resposta.

- [ ] **Step 2: Atualizar o CORS para usar Settings**

Em `main.py`, trocar `allow_origins=["http://localhost:5173"]` por:

```python
allow_origins=settings.cors_origins,
```

com `from app.config import settings` no topo.

- [ ] **Step 3: Rodar a suíte completa + smoke test manual**

```bash
cd backend && venv/Scripts/python -m pytest tests -v
```

Expected: 7 passed.

Subir o servidor e conferir o fluxo no navegador (login → dashboard → transações).

- [ ] **Step 4: Commit**

```bash
git add backend/app/main.py
git commit -m "feat: handler global de erros e CORS configuravel"
```

---

## Verificação final contra a spec

- §1 Higiene de segredos → Task 1 (+ ações manuais do usuário: senha do Postgres, token do BotFather)
- §2 JWT + require_auth em todos os routers + frontend → Tasks 3, 4, 5
- §3 Configuração central → Task 2 (CORS na Task 7 Step 2)
- §4 Alembic → Task 6
- §5 Handler de erros + smoke tests → Tasks 3/4 (testes) e 7 (handler)
