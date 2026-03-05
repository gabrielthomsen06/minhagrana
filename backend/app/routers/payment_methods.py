from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PaymentMethod
from ..schemas import PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodResponse

router = APIRouter(tags=["payment_methods"])


@router.get("/payment-methods", response_model=List[PaymentMethodResponse])
def list_payment_methods(db: Session = Depends(get_db)):
    return db.query(PaymentMethod).order_by(PaymentMethod.name).all()


@router.post("/payment-methods", response_model=PaymentMethodResponse, status_code=201)
def create_payment_method(data: PaymentMethodCreate, db: Session = Depends(get_db)):
    existing = db.query(PaymentMethod).filter(PaymentMethod.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Forma de pagamento já existe")
    pm = PaymentMethod(**data.model_dump())
    db.add(pm)
    db.commit()
    db.refresh(pm)
    return pm


@router.get("/payment-methods/{pm_id}", response_model=PaymentMethodResponse)
def get_payment_method(pm_id: int, db: Session = Depends(get_db)):
    pm = db.query(PaymentMethod).filter(PaymentMethod.id == pm_id).first()
    if not pm:
        raise HTTPException(status_code=404, detail="Forma de pagamento não encontrada")
    return pm


@router.put("/payment-methods/{pm_id}", response_model=PaymentMethodResponse)
def update_payment_method(
    pm_id: int, data: PaymentMethodUpdate, db: Session = Depends(get_db)
):
    pm = db.query(PaymentMethod).filter(PaymentMethod.id == pm_id).first()
    if not pm:
        raise HTTPException(status_code=404, detail="Forma de pagamento não encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pm, field, value)
    db.commit()
    db.refresh(pm)
    return pm


@router.delete("/payment-methods/{pm_id}", status_code=204)
def delete_payment_method(pm_id: int, db: Session = Depends(get_db)):
    pm = db.query(PaymentMethod).filter(PaymentMethod.id == pm_id).first()
    if not pm:
        raise HTTPException(status_code=404, detail="Forma de pagamento não encontrada")
    db.delete(pm)
    db.commit()
