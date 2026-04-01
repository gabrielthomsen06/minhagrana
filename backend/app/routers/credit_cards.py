from datetime import date
from calendar import monthrange
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models

router = APIRouter(tags=["credit_cards"])


def get_invoice_period(year: int, month: int, closing_day: int):
    """
    Calcula o período da fatura de um cartão de crédito.
    Fatura fecha no dia closing_day do mês.
    Período: closing_day+1 do mês anterior até closing_day do mês atual.
    """
    # Fim do período: dia do fechamento no mês atual
    _, max_day = monthrange(year, month)
    end_day = min(closing_day, max_day)
    period_end = date(year, month, end_day)

    # Início do período: closing_day+1 do mês anterior
    if month == 1:
        prev_year, prev_month = year - 1, 12
    else:
        prev_year, prev_month = year, month - 1

    _, prev_max = monthrange(prev_year, prev_month)
    start_day = min(closing_day + 1, prev_max)
    period_start = date(prev_year, prev_month, start_day)

    return period_start, period_end


def _get_credit_method(db: Session):
    return db.query(models.PaymentMethod).filter(
        models.PaymentMethod.name == "Crédito"
    ).first()


@router.get("/credit-cards/summary")
def get_credit_cards_summary(
    month: int = Query(...), year: int = Query(...), db: Session = Depends(get_db)
):
    """Resumo de todas as faturas de cartão de crédito para o mês/ano."""
    credit_banks = db.query(models.Bank).filter(
        models.Bank.closing_day.isnot(None)
    ).all()

    credit_method = _get_credit_method(db)
    if not credit_method:
        return []

    result = []
    for bank in credit_banks:
        period_start, period_end = get_invoice_period(year, month, bank.closing_day)

        invoice_total = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.bank_id == bank.id,
            models.Transaction.payment_method_id == credit_method.id,
            models.Transaction.type == "expense",
            models.Transaction.date >= period_start,
            models.Transaction.date <= period_end,
        ).scalar() or 0

        limit = float(bank.credit_limit or 0)
        result.append({
            "bank_id": bank.id,
            "bank_name": bank.name,
            "closing_day": bank.closing_day,
            "credit_limit": limit,
            "current_invoice_total": float(invoice_total),
            "available_limit": limit - float(invoice_total),
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
        })

    return result


@router.get("/credit-cards/invoice")
def get_credit_card_invoice(
    bank_id: int = Query(...),
    month: int = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
):
    """Detalhes da fatura de um cartão específico com lista de transações."""
    bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not bank or not bank.closing_day:
        raise HTTPException(status_code=404, detail="Cartão de crédito não encontrado")

    credit_method = _get_credit_method(db)
    if not credit_method:
        raise HTTPException(status_code=404, detail="Método de pagamento Crédito não encontrado")

    period_start, period_end = get_invoice_period(year, month, bank.closing_day)

    transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.bank_id == bank.id,
            models.Transaction.payment_method_id == credit_method.id,
            models.Transaction.type == "expense",
            models.Transaction.date >= period_start,
            models.Transaction.date <= period_end,
        )
        .order_by(models.Transaction.date.desc())
        .all()
    )

    invoice_total = sum(float(t.amount) for t in transactions)
    limit = float(bank.credit_limit or 0)

    return {
        "bank_id": bank.id,
        "bank_name": bank.name,
        "closing_day": bank.closing_day,
        "credit_limit": limit,
        "invoice_total": invoice_total,
        "available_limit": limit - invoice_total,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "transactions": [
            {
                "id": t.id,
                "description": t.description,
                "amount": float(t.amount),
                "date": t.date.isoformat(),
                "category_name": t.category.name,
                "category_icon": t.category.icon,
                "installment_current": t.installment_current,
                "installment_total": t.installment_total,
            }
            for t in transactions
        ],
    }
