from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
import uuid
from app.models import CategoryType, TransactionType

# Category schemas
class CategoryBase(BaseModel):
    name: str
    type: CategoryType
    icon: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[CategoryType] = None
    icon: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Bank schemas
class BankBase(BaseModel):
    name: str

class BankCreate(BankBase):
    pass

class BankUpdate(BaseModel):
    name: Optional[str] = None

class BankResponse(BankBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# PaymentMethod schemas
class PaymentMethodBase(BaseModel):
    name: str

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None

class PaymentMethodResponse(PaymentMethodBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Transaction schemas
class TransactionBase(BaseModel):
    type: TransactionType
    amount: Decimal
    description: str
    category_id: int
    bank_id: int
    payment_method_id: int
    date: date

class TransactionCreate(TransactionBase):
    installment_total: Optional[int] = None

class TransactionUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: Optional[TransactionType] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    bank_id: Optional[int] = None
    payment_method_id: Optional[int] = None
    date: Optional[date] = None

class TransactionResponse(TransactionBase):
    id: int
    installment_current: Optional[int] = None
    installment_total: Optional[int] = None
    installment_group_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    category: CategoryResponse
    bank: BankResponse
    payment_method: PaymentMethodResponse
    model_config = ConfigDict(from_attributes=True)