from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["banks"])

@router.post("/banks", response_model=schemas.BankResponse, status_code=201)
def create_bank(bank: schemas.BankCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Bank).filter(models.Bank.name == bank.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Banco já existe")
    db_bank = models.Bank(**bank.model_dump())
    db.add(db_bank)
    db.commit()
    db.refresh(db_bank)
    return db_bank

@router.get("/banks", response_model=list[schemas.BankResponse])
def list_banks(db: Session = Depends(get_db)):
    return db.query(models.Bank).order_by(models.Bank.name).all()

@router.get("/banks/{bank_id}", response_model=schemas.BankResponse)
def get_bank(bank_id: int, db: Session = Depends(get_db)):
    b = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    return b

@router.put("/banks/{bank_id}", response_model=schemas.BankResponse)
def update_bank(bank_id: int, bank: schemas.BankUpdate, db: Session = Depends(get_db)):
    b = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    for field, value in bank.model_dump(exclude_unset=True).items():
        setattr(b, field, value)
    db.commit()
    db.refresh(b)
    return b

@router.delete("/banks/{bank_id}", status_code=204)
def delete_bank(bank_id: int, db: Session = Depends(get_db)):
    b = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    db.delete(b)
    db.commit()
