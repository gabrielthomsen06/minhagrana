from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Transaction, Category

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/summary")
def get_summary(
    month: int = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
):
    q = db.query(Transaction).filter(
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    )
    transactions = q.all()

    total_income = sum(float(t.amount) for t in transactions if t.type == "income")
    total_expenses = sum(float(t.amount) for t in transactions if t.type == "expense")
    balance = total_income - total_expenses

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "month": month,
        "year": year,
    }


@router.get("/dashboard/by-category")
def get_by_category(
    month: int = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            Category.name.label("category"),
            Category.icon.label("icon"),
            func.sum(Transaction.amount).label("total"),
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.type == "expense",
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
        .group_by(Category.id, Category.name, Category.icon)
        .all()
    )

    return [
        {"category": r.category, "icon": r.icon, "total": float(r.total)}
        for r in results
    ]


@router.get("/dashboard/monthly-evolution")
def get_monthly_evolution(year: int = Query(...), db: Session = Depends(get_db)):
    data = []
    for month in range(1, 13):
        transactions = (
            db.query(Transaction)
            .filter(
                extract("month", Transaction.date) == month,
                extract("year", Transaction.date) == year,
            )
            .all()
        )
        income = sum(float(t.amount) for t in transactions if t.type == "income")
        expenses = sum(float(t.amount) for t in transactions if t.type == "expense")
        data.append({"month": month, "income": income, "expenses": expenses})
    return data
