# Deploy Vercel + Supabase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar o minhagrana na Vercel (frontend estático + FastAPI serverless, mesma origem) com PostgreSQL no Supabase, começando com banco zerado.

**Architecture:** Um único projeto Vercel conectado ao GitHub. O frontend Vite vira estático (`frontend/dist`); o FastAPI existente é exposto pelo runtime Python da Vercel via `api/index.py`; rewrites mandam `/api/*` para a função e o resto para o SPA. Runtime conecta no Supabase via transaction pooler (6543) com `NullPool`; migrações rodam da máquina local contra a conexão direta (5432).

**Tech Stack:** Vercel (static build + Python runtime), Supabase Postgres, Alembic, SQLAlchemy NullPool, Vite/React, FastAPI.

**Spec:** `docs/superpowers/specs/2026-07-06-deploy-vercel-supabase-design.md`

**Diretório de trabalho:** raiz do repo `C:\Users\gabri\minhagrana`; comandos backend a partir de `backend/` (`.env`/`alembic.ini` resolvem pelo cwd). Python do projeto: `backend/venv/Scripts/python`.

---

## Contexto para quem nunca viu o repo

- Monorepo: `frontend/` (Vite+React, axios `baseURL: '/api'`, proxy dev para localhost:8000) e `backend/` (FastAPI, config em `app/config.py` via pydantic-settings, JWT em `app/security.py`, Alembic com revisão inicial `b3a61cf1537e`).
- `backend/.env` (não versionado) tem `DATABASE_URL` (Postgres local), `SECRET_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` e sobras de `TELEGRAM_*`.
- Suíte: `cd backend && venv/Scripts/python -m pytest tests -v` → 10 passed. Dois testes leem o banco de verdade.
- `npm run build` (= `tsc && vite build`) FALHA hoje com 2 erros TS2345 em `frontend/src/pages/Categories.tsx` — Task 1 corrige.
- Tasks 4-6 têm passos manuais do usuário (dashboards Supabase/Vercel) — o executor PAUSA e pede os dados indicados.

---

### Task 1: Corrigir tipos em Categories.tsx (desbloqueia o build)

**Files:**
- Modify: `frontend/src/pages/Categories.tsx:5,10,59`

- [ ] **Step 1: Confirmar o vermelho**

Run: `cd frontend && npx tsc --noEmit`
Expected: 2 erros TS2345 nas linhas 22 e 25 (`type: string` não atribuível a `CategoryType | undefined`).

- [ ] **Step 2: Tipar o estado do formulário**

Em `frontend/src/pages/Categories.tsx`:

Linha 5, trocar:
```typescript
import type { Category } from '../types'
```
por:
```typescript
import type { Category, CategoryType } from '../types'
```

Linha 10, trocar:
```typescript
  const [form, setForm] = useState({ name: '', type: 'expense', icon: '' })
```
por:
```typescript
  const [form, setForm] = useState<{ name: string; type: CategoryType; icon: string }>({ name: '', type: 'expense', icon: '' })
```

Linha 59, trocar:
```typescript
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="glass-select">
```
por:
```typescript
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CategoryType }))} className="glass-select">
```

Nada mais muda (os `setForm({ name: '', type: 'expense', icon: '' })` das linhas 28/44 e o da linha 103 passam a validar com o estado tipado).

- [ ] **Step 3: Verificar o verde**

Run: `cd frontend && npx tsc --noEmit` → sem erros.
Run: `cd frontend && npm run build` → build completo sem erros (gera `frontend/dist/`).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Categories.tsx
git commit -m "fix: tipos CategoryType no formulario de categorias"
```

---

### Task 2: Ajustes do backend para serverless

**Files:**
- Modify: `backend/app/database.py`
- Modify: `backend/app/seed.py:5-8`
- Modify: `backend/requirements.txt`

- [ ] **Step 1: NullPool em `backend/app/database.py`**

Conteúdo completo novo:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

from app.config import settings

# NullPool: em serverless cada invocação é efêmera; o pooling real é do
# transaction pooler do Supabase.
engine = create_engine(settings.database_url, poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 2: Remover create_all do `backend/app/seed.py`**

Trocar:
```python
from app.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(bind=engine)
```
por:
```python
from app.database import SessionLocal
from app import models
```

- [ ] **Step 3: Remover `python-telegram-bot` de `backend/requirements.txt`**

Apagar a linha `python-telegram-bot==21.6`. As demais linhas ficam.

- [ ] **Step 4: Rodar a suíte**

Run: `cd backend && venv/Scripts/python -m pytest tests -v`
Expected: 10 passed (ainda contra o Postgres local).

- [ ] **Step 5: Commit**

```bash
git add backend/app/database.py backend/app/seed.py backend/requirements.txt
git commit -m "feat: NullPool para serverless; seed sem create_all"
```

---

### Task 3: Scaffolding Vercel (api/index.py, requirements.txt raiz, vercel.json)

**Files:**
- Create: `api/index.py`
- Create: `requirements.txt` (raiz)
- Create: `vercel.json`

- [ ] **Step 1: Criar `api/index.py`**

```python
import os
import sys

sys.path.insert(
    0,
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"),
)

from app.main import app  # noqa: E402,F401
```

O runtime Python da Vercel detecta a variável `app` (ASGI) exportada.

- [ ] **Step 2: Criar `requirements.txt` na raiz** (runtime da função; pins idênticos aos de `backend/requirements.txt`):

```
fastapi==0.115.0
sqlalchemy==2.0.35
psycopg2-binary==2.9.11
pydantic==2.9.2
pydantic-settings==2.6.1
PyJWT==2.10.1
bcrypt==4.2.1
python-dateutil==2.9.0
openpyxl==3.1.5
python-multipart==0.0.22
```

(Sem uvicorn/pytest/alembic/httpx — só o que a função importa em runtime.)

- [ ] **Step 3: Criar `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Arquivos estáticos existentes em `frontend/dist` são servidos antes dos rewrites; o segundo rewrite é o fallback SPA do react-router.

- [ ] **Step 4: Verificar que a ponte importa**

Run (da raiz do repo): `backend/venv/Scripts/python -c "import sys; sys.path.insert(0, 'api'); import index; print(index.app.title)"`
Expected: `Minha Grana API`

- [ ] **Step 5: Commit e push** (o push é necessário para a Vercel importar o estado final)

```bash
git add api/index.py requirements.txt vercel.json
git commit -m "feat: scaffolding vercel (funcao python + rewrites SPA)"
git push origin main
```

---

### Task 4: Provisionar Supabase e criar o schema

**Passos manuais do usuário — PAUSAR e pedir:**

- [ ] **Step 1 (usuário, com roteiro):** No dashboard do Supabase: New project → região `South America (São Paulo)` → definir e guardar a senha do banco. Depois, em Settings → Database → Connection string, copiar as DUAS strings:
  1. **Transaction pooler** (host `*.pooler.supabase.com`, porta **6543**)
  2. **Session pooler ou Direct** (porta **5432**)

  Pedir ao usuário que cole as duas strings (com a senha).

- [ ] **Step 2: Rodar as migrações contra a conexão DIRETA (5432)**

```bash
cd backend
DATABASE_URL="<string porta 5432, com ?sslmode=require>" venv/Scripts/alembic upgrade head
```

Expected: `Running upgrade -> b3a61cf1537e`. Se a URL vier sem `sslmode`, acrescentar `?sslmode=require`.

- [ ] **Step 3: Verificar as tabelas**

```bash
cd backend
DATABASE_URL="<string 5432>" venv/Scripts/python -c "import sqlalchemy as sa; e=sa.create_engine('<string 5432>'); print(sorted(sa.inspect(e).get_table_names()))"
```

Expected: `['alembic_version', 'banks', 'categories', 'investment_accounts', 'payment_methods', 'transactions']`

- [ ] **Step 4 (PERGUNTAR ao usuário): rodar o seed?** Se sim:

```bash
cd backend
DATABASE_URL="<string 5432>" venv/Scripts/python -m app.seed
```

Expected: `Seed concluído com sucesso!` (12 categorias, bancos Itaú/XP, Débito/Crédito, 2 contas de investimento).

Sem commit nesta task (nenhum arquivo do repo muda).

---

### Task 5: Apontar o dev local para o Supabase

**Files:**
- Modify: `backend/.env` (local, não versionado)

- [ ] **Step 1: Trocar o `DATABASE_URL` do `.env`** pela string do **transaction pooler (6543)**, mantendo as demais chaves. Acrescentar `?sslmode=require` se não vier.

- [ ] **Step 2: Suíte completa contra o Supabase**

Run: `cd backend && venv/Scripts/python -m pytest tests -v`
Expected: 10 passed (mais lento que antes — rede). Se `test_protected_route_with_valid_token` falhar por timeout, reportar em vez de mascarar.

- [ ] **Step 3: Smoke local**

```bash
cd backend && venv/Scripts/python -m uvicorn app.main:app --port 8003 &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8003/api/categories   # esperado: 401
kill %1
```

Sem commit (só `.env` local mudou).

---

### Task 6: Projeto Vercel, variáveis e deploy

- [ ] **Step 1: Gerar a SECRET_KEY de produção** (nova, não reutilizar a de dev):

```bash
cd backend && venv/Scripts/python -c "import secrets; print(secrets.token_hex(32))"
```

- [ ] **Step 2 (usuário, com roteiro):** No dashboard da Vercel: Add New → Project → importar `gabrielthomsen06/minhagrana` → Root Directory = raiz do repo (não mudar) → antes do deploy, em Environment Variables (Production) adicionar:
  - `DATABASE_URL` = string do transaction pooler (6543) com `sslmode=require`
  - `SECRET_KEY` = valor gerado no Step 1
  - `ADMIN_USERNAME` = mesmo do `.env` local
  - `ADMIN_PASSWORD_HASH` = mesmo do `.env` local (atenção para colar o hash inteiro, começa com `$2b$12$`)
  - `CORS_ORIGINS` = `["https://<projeto>.vercel.app"]` (ajustar ao domínio real após o primeiro deploy, se necessário)

  Deploy. Pedir ao usuário a URL final (ex.: `https://minhagrana.vercel.app`).

- [ ] **Step 3: Smoke tests no domínio público** (substituir `<URL>`):

```bash
curl -s -o /dev/null -w "%{http_code}\n" <URL>/                       # 200 (SPA)
curl -s -o /dev/null -w "%{http_code}\n" <URL>/dashboard              # 200 (fallback SPA)
curl -s -o /dev/null -w "%{http_code}\n" <URL>/api/categories         # 401 (protegida)
curl -s -X POST <URL>/api/auth/login -H "Content-Type: application/json" -d '{"username":"x","password":"y"}' -o /dev/null -w "%{http_code}\n"   # 401 (login público, credencial errada)
curl -s -o /dev/null -w "%{http_code}\n" <URL>/docs                   # 200
```

- [ ] **Step 4 (usuário):** Abrir a URL no celular/navegador, logar com as credenciais reais, criar uma transação de teste e confirmar que aparece no dashboard. (O executor não conhece a senha — este passo é humano por design.)

- [ ] **Step 5: Registrar o resultado** — reportar URL final e qualquer ajuste feito (ex.: CORS_ORIGINS corrigido para o domínio real). Sem commit, a menos que algum ajuste de config tenha sido necessário (nesse caso, commit + push do ajuste com mensagem descritiva).

---

## Verificação final contra a spec

- §1 Estrutura Vercel → Task 3
- §2 Mudanças no código (Categories.tsx, NullPool, seed, requirements) → Tasks 1-2
- §3 Supabase + migrações + seed opcional → Task 4
- §4 Vercel + env vars + deploy → Task 6
- §5 Dev local no Supabase → Task 5
- §6 Verificação → Tasks 5 (local) e 6 (produção)

## Riscos operacionais para o executor

- Se o build da função Python falhar por causa do `psycopg2-binary`, trocar para `psycopg2-binary` → `psycopg[binary]==3.2.*` no `requirements.txt` da raiz exige também mudar a URL para `postgresql+psycopg://` — decisão do controlador, não improvisar (spec, seção Riscos).
- Nunca rodar migração pela função serverless; sempre local contra a porta 5432.
- Nunca commitar connection strings/senhas em nenhum arquivo versionado.
