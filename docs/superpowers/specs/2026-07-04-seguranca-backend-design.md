# Design: Segurança essencial + fundação de arquitetura do backend

**Data:** 2026-07-04
**Status:** Aprovado pelo usuário

## Contexto

O Minha Grana é uma aplicação de finanças pessoais (FastAPI + PostgreSQL no backend, React/Vite no frontend) de **usuário único**. Hoje roda apenas localmente, mas o plano é publicar na Vercel para acesso pelo celular. Isso implica backend serverless (sem estado em memória entre requests) e banco PostgreSQL hospedado (ex.: Neon/Supabase) em etapa futura.

### Problemas encontrados (estado atual)

1. **Nenhuma rota de dados exige autenticação.** O login existe e emite token, mas nenhum endpoint o verifica.
2. **Senha de admin hardcoded** como fallback em `backend/app/routers/auth.py`.
3. **Segredos commitados**: `backend/.env` está versionado com senha do PostgreSQL e token do bot do Telegram. Devem ser considerados vazados.
4. Senha comparada em texto puro; token opaco guardado em memória do processo (quebra em serverless); sem expiração.
5. Frontend guarda o token no `localStorage` mas **nunca o envia** nas requisições.
6. Sem migrações (usa `Base.metadata.create_all` no startup), sem configuração central, `__pycache__` versionado e `venv/` dentro do repositório.

### Decisões de escopo (confirmadas com o usuário)

- Usuário único (admin via variáveis de ambiente). Sem tabela de usuários nem cadastro.
- Bot do Telegram **fora do escopo** (usuário não usa). Apenas revogar o token vazado.
- Sem camada de serviços/repositórios por ora (CRUD simples, app pessoal).
- O deploy na Vercel em si fica para etapa futura; este trabalho deixa o backend pronto para isso.

## Design

### 1. Higiene de segredos e repositório

- Criar `.gitignore` na raiz cobrindo `backend/.env`, `**/__pycache__/`, `backend/venv/`.
- Remover do índice do git (via `git rm --cached`) o `.env` e os `.pyc` já rastreados — os arquivos permanecem no disco.
- Criar `backend/.env.example` documentando as chaves necessárias, sem valores reais.
- Remover credenciais hardcoded do código — sem fallback de senha.
- **Ação manual do usuário**: trocar a senha do PostgreSQL e revogar o token do bot no BotFather. O histórico do git continua contendo os valores antigos; a troca dos segredos é o que mitiga.

### 2. Autenticação stateless com JWT

**Backend:**

- `POST /auth/login` valida `username` contra `ADMIN_USERNAME` e a senha contra `ADMIN_PASSWORD_HASH` (hash bcrypt armazenado no `.env`). Incluir script/comando para o usuário gerar o hash.
- Sucesso emite JWT assinado (HS256) com `SECRET_KEY` e expiração de **7 dias**. Sem estado no servidor — compatível com serverless.
- Dependency `require_auth` usando `HTTPBearer`, validando assinatura e expiração do JWT. Aplicada via `dependencies=[Depends(require_auth)]` em todos os routers de dados: transactions, categories, banks, payment_methods, dashboard, export, annual_vision, credit_cards, investments.
- Rotas públicas: apenas `POST /auth/login` e `GET /`.
- `POST /auth/verify` e `POST /auth/logout` são removidos (verificação é a validação do próprio JWT; logout é apagar o token no cliente).

**Frontend:**

- Interceptor de request no axios adicionando `Authorization: Bearer <token>` a partir do `localStorage`.
- Interceptor de response: em `401`, limpar `localStorage` e redirecionar para o login (token expirado/inválido).

### 3. Configuração central (`app/config.py`)

- Classe `Settings` com `pydantic-settings`: `database_url`, `secret_key`, `admin_username`, `admin_password_hash`, `cors_origins` (lista; default `["http://localhost:5173"]`).
- Variáveis obrigatórias sem default (falha na inicialização com mensagem clara se ausentes). Nenhum default inseguro.
- `main.py` (CORS) e `database.py` passam a consumir `Settings`.

### 4. Migrações com Alembic

- Configurar Alembic apontando para a `Base`/modelos existentes.
- Gerar migração inicial a partir dos modelos atuais; no banco local existente, executar `alembic stamp head` (sem tocar nos dados).
- Remover `Base.metadata.create_all` do lifespan; o schema evolui apenas por migração.

### 5. Tratamento de erros e testes mínimos

- Handler global de exceções que retorna erro genérico 500 sem vazar stack trace/detalhes internos.
- Smoke tests com pytest:
  - Login com credenciais corretas → 200 + token.
  - Login com credenciais erradas → 401.
  - Rota protegida sem token → 401/403.
  - Rota protegida com token válido → 200.

## Fora do escopo

- Bot do Telegram (revogação do token é ação manual do usuário).
- Multi-usuário / tabela de usuários.
- Camada de serviços/repositórios e refactor arquitetural amplo.
- Deploy na Vercel e provisionamento de banco hospedado.
- Rate limiting (irrelevante enquanto local; pode ser adicionado no deploy).

## Riscos e observações

- Em serverless, conexões de banco devem usar pool adequado/pooler do provedor — tratar na etapa de deploy.
- A expiração de 7 dias do JWT significa re-login semanal no celular; aceitável para uso pessoal.
- Segredos antigos permanecem no histórico do git; a mitigação é a rotação (senha do Postgres e token do bot).
