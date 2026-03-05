from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


# ── Category ────────────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str
    type: str
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    icon: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Bank ─────────────────────────────────────────────────────────────────────

class BankBase(BaseModel):
    name: str


class BankCreate(BankBase):
    pass


class BankUpdate(BaseModel):
    name: Optional[str] = None


class BankResponse(BankBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── PaymentMethod ────────────────────────────────────────────────────────────

class PaymentMethodBase(BaseModel):
    name: str


class PaymentMethodCreate(PaymentMethodBase):
    pass


class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None


class PaymentMethodResponse(PaymentMethodBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Transaction ──────────────────────────────────────────────────────────────

class TransactionBase(BaseModel):
    type: str
    amount: Decimal
    description: Optional[str] = None
    category_id: Optional[int] = None
    bank_id: Optional[int] = None
    payment_method_id: Optional[int] = None
    date: datetime


class TransactionCreate(TransactionBase):
    installment_total: Optional[int] = None


class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    bank_id: Optional[int] = None
    payment_method_id: Optional[int] = None
    date: Optional[datetime] = None


class TransactionResponse(TransactionBase):
    id: int
    installment_current: Optional[int] = None
    installment_total: Optional[int] = None
    installment_group_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    bank: Optional[BankResponse] = None
    payment_method: Optional[PaymentMethodResponse] = None

    class Config:
        from_attributes = True
