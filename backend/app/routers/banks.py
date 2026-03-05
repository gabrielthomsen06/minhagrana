from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Bank
from ..schemas import BankCreate, BankUpdate, BankResponse

router = APIRouter(tags=["banks"])


@router.get("/banks", response_model=List[BankResponse])
def list_banks(db: Session = Depends(get_db)):
    return db.query(Bank).order_by(Bank.name).all()


@router.post("/banks", response_model=BankResponse, status_code=201)
def create_bank(data: BankCreate, db: Session = Depends(get_db)):
    existing = db.query(Bank).filter(Bank.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Banco já existe")
    b = Bank(**data.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.get("/banks/{bank_id}", response_model=BankResponse)
def get_bank(bank_id: int, db: Session = Depends(get_db)):
    b = db.query(Bank).filter(Bank.id == bank_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    return b


@router.put("/banks/{bank_id}", response_model=BankResponse)
def update_bank(bank_id: int, data: BankUpdate, db: Session = Depends(get_db)):
    b = db.query(Bank).filter(Bank.id == bank_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(b, field, value)
    db.commit()
    db.refresh(b)
    return b


@router.delete("/banks/{bank_id}", status_code=204)
def delete_bank(bank_id: int, db: Session = Depends(get_db)):
    b = db.query(Bank).filter(Bank.id == bank_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    db.delete(b)
    db.commit()
