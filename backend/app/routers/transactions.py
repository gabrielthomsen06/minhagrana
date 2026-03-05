import uuid
from datetime import date
from dateutil.relativedelta import relativedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from decimal import Decimal

router = APIRouter(tags=["transactions"])

@router.post("/transactions", response_model=schemas.TransactionResponse, status_code=201)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    if transaction.installment_total and transaction.installment_total > 1:
        group_id = uuid.uuid4()
        total = Decimal(str(transaction.amount))
        base_amount = round(total / transaction.installment_total, 2)
        remainder = round(total - base_amount * transaction.installment_total, 2)
        first = None
        for i in range(1, transaction.installment_total + 1):
            installment_date = transaction.date + relativedelta(months=i - 1)
            # Add rounding remainder to the last installment so the sum equals the original amount
            amount = base_amount + remainder if i == transaction.installment_total else base_amount
            db_transaction = models.Transaction(
                type=transaction.type,
                amount=amount,
                description=transaction.description,
                category_id=transaction.category_id,
                bank_id=transaction.bank_id,
                payment_method_id=transaction.payment_method_id,
                date=installment_date,
                installment_current=i,
                installment_total=transaction.installment_total,
                installment_group_id=group_id,
            )
            db.add(db_transaction)
            if i == 1:
                db.flush()
                first = db_transaction
        db.commit()
        db.refresh(first)
        return first
    else:
        db_transaction = models.Transaction(
            type=transaction.type,
            amount=transaction.amount,
            description=transaction.description,
            category_id=transaction.category_id,
            bank_id=transaction.bank_id,
            payment_method_id=transaction.payment_method_id,
            date=transaction.date,
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction

@router.get("/transactions", response_model=list[schemas.TransactionResponse])
def list_transactions(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    bank_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    payment_method_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Transaction)
    if month:
        query = query.filter(extract("month", models.Transaction.date) == month)
    if year:
        query = query.filter(extract("year", models.Transaction.date) == year)
    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if bank_id:
        query = query.filter(models.Transaction.bank_id == bank_id)
    if type:
        query = query.filter(models.Transaction.type == type)
    if payment_method_id:
        query = query.filter(models.Transaction.payment_method_id == payment_method_id)
    return query.order_by(models.Transaction.date.desc()).all()

@router.get("/transactions/{transaction_id}", response_model=schemas.TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    t = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return t

@router.put("/transactions/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(transaction_id: int, transaction: schemas.TransactionUpdate, db: Session = Depends(get_db)):
    t = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    for field, value in transaction.model_dump(exclude_unset=True).items():
        setattr(t, field, value)
    db.commit()
    db.refresh(t)
    return t

@router.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, delete_group: bool = Query(False), db: Session = Depends(get_db)):
    t = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if delete_group and t.installment_group_id:
        db.query(models.Transaction).filter(models.Transaction.installment_group_id == t.installment_group_id).delete()
    else:
        db.delete(t)
    db.commit()
