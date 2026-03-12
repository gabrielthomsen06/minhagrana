from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app import models

router = APIRouter(tags=["annual_vision"])


@router.get("/annual-vision")
def get_annual_vision(year: int = Query(...), db: Session = Depends(get_db)):
    today = date.today()
    current_year = today.year

    if year < current_year:
        current_month = 12
    elif year > current_year:
        current_month = 0
    else:
        current_month = today.month

    monthly_series = []
    acc_income = 0.0
    acc_investments = 0.0
    acc_expenses_total = 0.0

    for month in range(1, 13):
        income = db.query(func.sum(models.Transaction.amount)).filter(
            extract("year", models.Transaction.date) == year,
            extract("month", models.Transaction.date) == month,
            models.Transaction.type == "income",
        ).scalar() or 0

        total_expense = db.query(func.sum(models.Transaction.amount)).filter(
            extract("year", models.Transaction.date) == year,
            extract("month", models.Transaction.date) == month,
            models.Transaction.type == "expense",
        ).scalar() or 0

        investments = (
            db.query(func.sum(models.Transaction.amount))
            .join(models.Category, models.Transaction.category_id == models.Category.id)
            .filter(
                extract("year", models.Transaction.date) == year,
                extract("month", models.Transaction.date) == month,
                models.Transaction.type == "expense",
                models.Category.name == "Investimentos",
            )
            .scalar() or 0
        )

        expenses = float(total_expense) - float(investments)

        monthly_series.append({
            "month": month,
            "income": float(income),
            "expenses": expenses,
            "investments": float(investments),
        })

        if month <= current_month:
            acc_income += float(income)
            acc_investments += float(investments)
            acc_expenses_total += expenses

    avg_monthly_expense = acc_expenses_total / current_month if current_month > 0 else 0.0

    # Monthly investments: individual transactions of category "Investimentos"
    inv_rows = (
        db.query(
            extract("month", models.Transaction.date).label("month"),
            models.Transaction.description,
            models.Transaction.amount,
        )
        .join(models.Category, models.Transaction.category_id == models.Category.id)
        .filter(
            extract("year", models.Transaction.date) == year,
            models.Transaction.type == "expense",
            models.Category.name == "Investimentos",
        )
        .order_by(extract("month", models.Transaction.date))
        .all()
    )

    monthly_investments = [
        {"month": int(r.month), "description": r.description, "amount": float(r.amount)}
        for r in inv_rows
    ]

    return {
        "year": year,
        "current_month": current_month,
        "accumulated": {
            "income": acc_income,
            "expenses": acc_expenses_total,
            "investments": acc_investments,
            "free_balance": acc_income - acc_expenses_total - acc_investments,
        },
        "average_monthly_expense": avg_monthly_expense,
        "monthly_investments": monthly_investments,
        "monthly_series": monthly_series,
    }
