# 💰 Minha Grana - Controle Financeiro Pessoal

Aplicação web completa de controle financeiro pessoal desenvolvida com **FastAPI** (backend) e **React + TypeScript + Tailwind CSS** (frontend).

## Funcionalidades

- 📊 **Dashboard** com resumo mensal, gráfico de despesas por categoria e evolução mensal
- 💸 **Transações** com suporte a parcelamento automático
- 🏷️ **Categorias** personalizáveis com ícones (receita, despesa ou ambos)
- 🏦 **Bancos** e **Métodos de Pagamento** configuráveis
- 📥 **Exportação** em CSV e Excel (.xlsx)
- 🌙 Tema escuro com interface em português brasileiro

## Pré-requisitos

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL** (rodando localmente)

## Configuração do Banco de Dados

Crie o banco de dados no PostgreSQL:

```sql
CREATE DATABASE minhagrana;
```

## Configuração do Backend

```bash
cd backend

# Criar e ativar ambiente virtual (Windows)
python -m venv venv
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variável de ambiente
copy .env.example .env
# Edite o arquivo .env se necessário (ajuste usuário/senha do PostgreSQL)

# Executar seed (dados iniciais)
python -m app.seed

# Iniciar servidor (porta 8000)
uvicorn app.main:app --reload
```

O backend estará disponível em: http://localhost:8000  
Documentação da API: http://localhost:8000/docs

## Configuração do Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 5173)
npm run dev
```

O frontend estará disponível em: http://localhost:5173

## Estrutura do Projeto

```
minhagrana/
├── backend/
│   ├── app/
│   │   ├── main.py          # Aplicação FastAPI
│   │   ├── database.py      # Configuração do SQLAlchemy
│   │   ├── models.py        # Modelos do banco de dados
│   │   ├── schemas.py       # Schemas Pydantic
│   │   ├── seed.py          # Dados iniciais
│   │   └── routers/
│   │       ├── transactions.py
│   │       ├── categories.py
│   │       ├── banks.py
│   │       ├── payment_methods.py
│   │       ├── dashboard.py
│   │       └── export.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/           # Dashboard, Transações, Categorias, etc.
    │   ├── components/      # Sidebar, Modais
    │   ├── services/        # Integração com API
    │   └── types/           # Interfaces TypeScript
    ├── package.json
    └── vite.config.ts
```

## Stack Técnica

- **Backend:** Python + FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React + TypeScript + Tailwind CSS + Recharts
- **Ambiente:** Windows, rodando localmente (sem Docker)
