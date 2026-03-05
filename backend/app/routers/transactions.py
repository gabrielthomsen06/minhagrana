import uuid
import calendar
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Transaction
from ..schemas import TransactionCreate, TransactionUpdate, TransactionResponse

router = APIRouter(tags=["transactions"])


def _add_months(dt: datetime, months: int) -> datetime:
    """Add months to a datetime, handling month-end edge cases."""
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


@router.post("/transactions", response_model=List[TransactionResponse], status_code=201)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    installment_total = data.installment_total or 1

    if installment_total > 1:
        group_id = uuid.uuid4()
        installment_amount = round(data.amount / installment_total, 2)
        transactions = []
        for i in range(installment_total):
            installment_date = _add_months(data.date, i)
            t = Transaction(
                type=data.type,
                amount=installment_amount,
                description=data.description,
                category_id=data.category_id,
                bank_id=data.bank_id,
                payment_method_id=data.payment_method_id,
                date=installment_date,
                installment_current=i + 1,
                installment_total=installment_total,
                installment_group_id=group_id,
            )
            db.add(t)
            transactions.append(t)
        db.commit()
        for t in transactions:
            db.refresh(t)
        return transactions
    else:
        t = Transaction(
            type=data.type,
            amount=data.amount,
            description=data.description,
            category_id=data.category_id,
            bank_id=data.bank_id,
            payment_method_id=data.payment_method_id,
            date=data.date,
        )
        db.add(t)
        db.commit()
        db.refresh(t)
        return [t]


@router.get("/transactions", response_model=List[TransactionResponse])
def list_transactions(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    bank_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    payment_method_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Transaction)
    if month:
        q = q.filter(extract("month", Transaction.date) == month)
    if year:
        q = q.filter(extract("year", Transaction.date) == year)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if bank_id:
        q = q.filter(Transaction.bank_id == bank_id)
    if type:
        q = q.filter(Transaction.type == type)
    if payment_method_id:
        q = q.filter(Transaction.payment_method_id == payment_method_id)
    return q.order_by(Transaction.date.desc()).all()


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return t


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int, data: TransactionUpdate, db: Session = Depends(get_db)
):
    t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(t, field, value)
    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return t


@router.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    delete_group: bool = Query(False),
    db: Session = Depends(get_db),
):
    t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    if delete_group and t.installment_group_id:
        db.query(Transaction).filter(
            Transaction.installment_group_id == t.installment_group_id
        ).delete()
    else:
        db.delete(t)
    db.commit()
