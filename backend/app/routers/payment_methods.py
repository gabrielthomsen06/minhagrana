from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["payment_methods"])

@router.post("/payment-methods", response_model=schemas.PaymentMethodResponse, status_code=201)
def create_payment_method(pm: schemas.PaymentMethodCreate, db: Session = Depends(get_db)):
    existing = db.query(models.PaymentMethod).filter(models.PaymentMethod.name == pm.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Método de pagamento já existe")
    db_pm = models.PaymentMethod(**pm.model_dump())
    db.add(db_pm)
    db.commit()
    db.refresh(db_pm)
    return db_pm

@router.get("/payment-methods", response_model=list[schemas.PaymentMethodResponse])
def list_payment_methods(db: Session = Depends(get_db)):
    return db.query(models.PaymentMethod).order_by(models.PaymentMethod.name).all()

@router.get("/payment-methods/{pm_id}", response_model=schemas.PaymentMethodResponse)
def get_payment_method(pm_id: int, db: Session = Depends(get_db)):
    pm = db.query(models.PaymentMethod).filter(models.PaymentMethod.id == pm_id).first()
    if not pm:
        raise HTTPException(status_code=404, detail="Método de pagamento não encontrado")
    return pm

@router.put("/payment-methods/{pm_id}", response_model=schemas.PaymentMethodResponse)
def update_payment_method(pm_id: int, pm: schemas.PaymentMethodUpdate, db: Session = Depends(get_db)):
    p = db.query(models.PaymentMethod).filter(models.PaymentMethod.id == pm_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Método de pagamento não encontrado")
    for field, value in pm.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return p

@router.delete("/payment-methods/{pm_id}", status_code=204)
def delete_payment_method(pm_id: int, db: Session = Depends(get_db)):
    pm = db.query(models.PaymentMethod).filter(models.PaymentMethod.id == pm_id).first()
    if not pm:
        raise HTTPException(status_code=404, detail="Método de pagamento não encontrado")
    db.delete(pm)
    db.commit()
