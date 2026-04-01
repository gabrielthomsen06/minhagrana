from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["investments"])


@router.get("/investments/portfolio")
def get_portfolio(db: Session = Depends(get_db)):
    """Retorna todas as contas de investimento com totais."""
    accounts = db.query(models.InvestmentAccount).all()

    total = sum(float(a.balance) for a in accounts)
    items = []
    for a in accounts:
        items.append({
            "id": a.id,
            "bank_id": a.bank_id,
            "bank_name": a.bank.name,
            "balance": float(a.balance),
            "percentage": (float(a.balance) / total * 100) if total > 0 else 0,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        })

    return {
        "total_balance": total,
        "accounts": items,
    }


@router.post("/investments/portfolio", response_model=schemas.InvestmentAccountResponse)
def create_account(data: schemas.InvestmentAccountCreate, db: Session = Depends(get_db)):
    """Cria uma nova conta de investimento."""
    # Verificar se já existe conta para este banco
    existing = db.query(models.InvestmentAccount).filter(
        models.InvestmentAccount.bank_id == data.bank_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Já existe uma conta de investimento para este banco")

    account = models.InvestmentAccount(bank_id=data.bank_id, balance=data.balance)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.put("/investments/portfolio/{account_id}", response_model=schemas.InvestmentAccountResponse)
def update_account(account_id: int, data: schemas.InvestmentAccountUpdate, db: Session = Depends(get_db)):
    """Atualiza o saldo de uma conta de investimento."""
    account = db.query(models.InvestmentAccount).filter(
        models.InvestmentAccount.id == account_id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Conta não encontrada")

    account.balance = data.balance
    db.commit()
    db.refresh(account)
    return account


@router.delete("/investments/portfolio/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    """Remove uma conta de investimento."""
    account = db.query(models.InvestmentAccount).filter(
        models.InvestmentAccount.id == account_id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Conta não encontrada")

    db.delete(account)
    db.commit()
    return {"message": "Conta removida"}


@router.get("/investments/contributions")
def get_contributions(year: int = Query(...), db: Session = Depends(get_db)):
    """Retorna os aportes mensais do ano (transações da categoria Investimentos)."""
    rows = (
        db.query(
            extract("month", models.Transaction.date).label("month"),
            models.Transaction.description,
            models.Transaction.amount,
            models.Transaction.date,
            models.Bank.name.label("bank_name"),
        )
        .join(models.Category, models.Transaction.category_id == models.Category.id)
        .join(models.Bank, models.Transaction.bank_id == models.Bank.id)
        .filter(
            extract("year", models.Transaction.date) == year,
            models.Transaction.type == "expense",
            models.Category.name == "Investimentos",
        )
        .order_by(models.Transaction.date.desc())
        .all()
    )

    total_year = sum(float(r.amount) for r in rows)

    # Agrupar por mês
    monthly = {}
    for r in rows:
        m = int(r.month)
        if m not in monthly:
            monthly[m] = {"month": m, "total": 0, "transactions": []}
        monthly[m]["total"] += float(r.amount)
        monthly[m]["transactions"].append({
            "description": r.description,
            "amount": float(r.amount),
            "date": r.date.isoformat(),
            "bank_name": r.bank_name,
        })

    return {
        "year": year,
        "total_contributed": total_year,
        "monthly": sorted(monthly.values(), key=lambda x: x["month"], reverse=True),
    }
