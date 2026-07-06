# Design: Deploy na Vercel + PostgreSQL no Supabase

**Data:** 2026-07-06
**Status:** Aprovado pelo usuário

## Contexto

O minhagrana (React/Vite + FastAPI + PostgreSQL, usuário único) roda hoje apenas localmente. O backend já foi preparado para serverless (JWT stateless, config via env, migrações Alembic — ver spec 2026-07-04). Objetivo: publicar na Vercel para uso no celular, com banco no Supabase.

### Decisões confirmadas com o usuário

- **Arquitetura**: um único projeto Vercel — frontend estático + FastAPI como função serverless Python, mesma origem (Opção A).
- **Dados**: começar do zero no Supabase (sem migração do banco local); seed opcional de categorias/bancos padrão.
- **Dev local**: "tudo no Supabase" — o `.env` local aponta para o Supabase; o Postgres local se aposenta (a rotação da senha local deixa de ser necessária).
- **Contas**: usuário já tem Vercel e Supabase.
- Bot do Telegram permanece fora do escopo.

## Design

### 1. Estrutura Vercel (arquivos novos na raiz)

- **`api/index.py`**: ponte para o runtime Python da Vercel. Insere `backend/` no `sys.path` e importa `from app.main import app` (o runtime detecta o ASGI app exportado). Nenhuma mudança no backend.
- **`requirements.txt`** (raiz): somente dependências de runtime da função — fastapi, sqlalchemy, psycopg2-binary, pydantic, pydantic-settings, PyJWT, bcrypt, python-dateutil, openpyxl, python-multipart. Versões iguais às pinadas em `backend/requirements.txt`.
- **`vercel.json`**:
  - `buildCommand`: `cd frontend && npm install && npm run build`
  - `outputDirectory`: `frontend/dist`
  - Rewrites: `/api/(.*)` → `/api/index`; demais rotas que não sejam arquivos estáticos → `/index.html` (fallback SPA do react-router).

Deploy contínuo: projeto Vercel conectado ao repo GitHub (`gabrielthomsen06/minhagrana`), deploy a cada push na `main`.

### 2. Mudanças no código existente

- **`frontend/src/pages/Categories.tsx`**: corrigir os 2 erros TS2345 (linhas ~22 e ~25) tipando o estado do formulário como `CategoryType` em vez de `string`. Pré-requisito: sem isso `npm run build` (tsc) falha e o deploy é impossível.
- **`backend/app/database.py`**: `create_engine(..., poolclass=NullPool)` — em serverless cada invocação é efêmera; o pooling real é do Supabase (transaction pooler). Inofensivo em dev.
- **`backend/app/seed.py`**: remover o `Base.metadata.create_all(bind=engine)` do nível de módulo — schema é responsabilidade exclusiva do Alembic.
- **`backend/requirements.txt`**: remover `python-telegram-bot` (bot aposentado) e `uvicorn`/`httpx` permanecem (dev/testes).

### 3. Supabase (passos manuais do usuário, com roteiro)

1. Criar projeto no dashboard (região São Paulo / `sa-east-1`), guardar a senha do banco.
2. Obter as duas connection strings:
   - **Transaction pooler (porta 6543)** — runtime (Vercel) e `.env` local.
   - **Session/direta (porta 5432)** — apenas migrações.
3. Executado da máquina local (Claude, com a URL fornecida pelo usuário): `alembic upgrade head` contra a conexão direta → cria as 5 tabelas + enums + `alembic_version`.
4. Opcional (usuário decide na hora): rodar `seed.py` → categorias padrão, bancos Itaú/XP, métodos Débito/Crédito, contas de investimento.

### 4. Vercel (passos manuais do usuário, com roteiro)

1. Importar o repo GitHub; root do projeto = raiz do repo.
2. Variáveis de ambiente (Production):
   - `DATABASE_URL` — connection string do transaction pooler (6543), com `sslmode=require`.
   - `SECRET_KEY` — **nova**, gerada exclusivamente para produção (tokens de dev e prod ficam independentes).
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` — mesmos valores do `.env` local.
   - `CORS_ORIGINS` — `["https://<projeto>.vercel.app"]` (mesma origem torna CORS quase irrelevante, mas mantém o handler de 500 correto).
3. Deploy e smoke test.

### 5. Dev local

`backend/.env`: `DATABASE_URL` passa a apontar para o transaction pooler do Supabase. Consequências aceitas:
- Dev depende de internet e opera nos dados reais (decisão explícita do usuário).
- Os testes que leem o banco (`test_protected_route_with_valid_token` etc.) batem no Supabase.

### 6. Verificação

- Local: `npm run build` limpo; `pytest` 10/10 (contra Supabase após a troca do `.env`).
- Pós-deploy: login no domínio Vercel; criar e listar uma transação; conferir 401 sem token via curl no domínio público.
- Nota: o Swagger (`/docs`) do FastAPI **não** fica acessível em produção — só `/api/*` chega à função; `/docs` cai no fallback do SPA. Intencional: não expor a documentação interativa publicamente.

## Fora do escopo

- Bot do Telegram; domínio customizado; CI/CD além do deploy automático da Vercel; monitoramento/alertas; backup automatizado do Supabase (o free tier já faz backup diário).

## Riscos e observações

- **Cold start** de ~1-2s após inatividade — aceitável para uso pessoal.
- **psycopg2-binary** funciona no runtime Python da Vercel (Amazon Linux, wheels manylinux). Se o build da função falhar por dependência nativa, o fallback é trocar para `psycopg[binary]` (driver v3) — decisão tomada apenas se necessário.
- **Transaction pooler** não suporta prepared statements de sessão — o psycopg2 não os usa por padrão; sem impacto esperado.
- **Migrações nunca** rodam pela função serverless; sempre da máquina local contra a conexão direta.
- O free tier do Supabase pausa projetos após ~1 semana sem uso; o uso regular do app evita isso (e o dashboard permite retomar com um clique).
