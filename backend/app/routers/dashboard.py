from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app import models
from typing import Optional

router = APIRouter(tags=["dashboard"])

@router.get("/dashboard/summary")
def get_summary(month: int = Query(...), year: int = Query(...), db: Session = Depends(get_db)):
    base_query = db.query(models.Transaction).filter(
        extract("month", models.Transaction.date) == month,
        extract("year", models.Transaction.date) == year,
    )
    income = base_query.filter(models.Transaction.type == "income").with_entities(func.sum(models.Transaction.amount)).scalar() or 0
    total_expenses = base_query.filter(models.Transaction.type == "expense").with_entities(func.sum(models.Transaction.amount)).scalar() or 0

    # Separar despesas no crédito (não saem do bolso agora) das despesas à vista (saem imediatamente)
    credit_method = db.query(models.PaymentMethod).filter(models.PaymentMethod.name == "Crédito").first()
    credit_expenses = 0
    if credit_method:
        credit_expenses = base_query.filter(
            models.Transaction.type == "expense",
            models.Transaction.payment_method_id == credit_method.id,
        ).with_entities(func.sum(models.Transaction.amount)).scalar() or 0

    debit_expenses = float(total_expenses) - float(credit_expenses)

    return {
        "income": float(income),
        "expenses": float(total_expenses),
        "balance": float(income) - float(total_expenses),
        "debit_expenses": debit_expenses,
        "credit_expenses": float(credit_expenses),
        "real_balance": float(income) - debit_expenses,
    }

@router.get("/dashboard/by-category")
def get_by_category(month: int = Query(...), year: int = Query(...), db: Session = Depends(get_db)):
    results = (
        db.query(models.Category.name, models.Category.icon, func.sum(models.Transaction.amount).label("total"))
        .join(models.Transaction, models.Transaction.category_id == models.Category.id)
        .filter(
            extract("month", models.Transaction.date) == month,
            extract("year", models.Transaction.date) == year,
            models.Transaction.type == "expense",
        )
        .group_by(models.Category.id)
        .all()
    )
    return [{"category": r.name, "icon": r.icon, "total": float(r.total)} for r in results]

@router.get("/dashboard/monthly-evolution")
def get_monthly_evolution(year: int = Query(...), db: Session = Depends(get_db)):
    months = []
    for month in range(1, 13):
        income = db.query(func.sum(models.Transaction.amount)).filter(
            extract("year", models.Transaction.date) == year,
            extract("month", models.Transaction.date) == month,
            models.Transaction.type == "income",
        ).scalar() or 0
        expenses = db.query(func.sum(models.Transaction.amount)).filter(
            extract("year", models.Transaction.date) == year,
            extract("month", models.Transaction.date) == month,
            models.Transaction.type == "expense",
        ).scalar() or 0
        months.append({"month": month, "income": float(income), "expenses": float(expenses)})
    return months
