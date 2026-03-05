from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["categories"])

@router.post("/categories", response_model=schemas.CategoryResponse, status_code=201)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Categoria já existe")
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/categories", response_model=list[schemas.CategoryResponse])
def list_categories(type: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.Category)
    if type:
        query = query.filter(models.Category.type == type)
    return query.order_by(models.Category.name).all()

@router.get("/categories/{category_id}", response_model=schemas.CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return c

@router.put("/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category(category_id: int, category: schemas.CategoryUpdate, db: Session = Depends(get_db)):
    c = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    for field, value in category.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return c

@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    db.delete(c)
    db.commit()
