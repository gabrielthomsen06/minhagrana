# 💰 Minha Grana - Controle Financeiro Pessoal

Aplicação web completa de controle financeiro pessoal construída com **FastAPI** (backend) e **React + TypeScript + Tailwind CSS** (frontend).

## ✨ Funcionalidades

- Dashboard com resumo mensal (receitas, despesas e saldo)
- Gráfico de pizza com despesas por categoria
- Gráfico de barras com evolução mensal do ano
- CRUD completo de transações com suporte a parcelamento
- CRUD de categorias, bancos e formas de pagamento
- Filtros por mês, ano, categoria, banco e tipo
- Exportação de dados em CSV e Excel
- Interface 100% em Português Brasileiro
- Tema escuro

## 📋 Pré-requisitos

- **Python** 3.11+
- **Node.js** 18+
- **PostgreSQL** (instalado e rodando)

## 🚀 Configuração

### Banco de Dados

Crie o banco de dados no PostgreSQL:

```sql
CREATE DATABASE minhagrana;
```

### Backend

```bash
cd backend

# Criar e ativar o ambiente virtual (Windows)
python -m venv venv
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
copy .env.example .env
# Edite o .env se necessário com suas credenciais do PostgreSQL

# Executar o seed (dados iniciais)
python -m app.seed

# Iniciar o servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

## 🌐 Acesso

| Serviço  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:5173     |
| Backend  | http://localhost:8000     |
| API Docs | http://localhost:8000/docs |

## 🏗️ Estrutura do Projeto

```
minhagrana/
├── backend/
│   ├── app/
│   │   ├── main.py          # Aplicação FastAPI
│   │   ├── database.py      # Configuração do banco de dados
│   │   ├── models.py        # Modelos SQLAlchemy
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
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── Sidebar.tsx
    │   │   ├── TransactionModal.tsx
    │   │   └── DeleteConfirmModal.tsx
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Transactions.tsx
    │   │   ├── Categories.tsx
    │   │   ├── Banks.tsx
    │   │   ├── PaymentMethods.tsx
    │   │   └── Export.tsx
    │   ├── services/
    │   │   └── api.ts
    │   └── types/
    │       └── index.ts
    ├── package.json
    └── vite.config.ts
```

## 🛠️ Stack Técnica

- **Backend:** Python + FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Gráficos:** Recharts
- **Ícones:** Lucide React
- **Notificações:** React Hot Toast