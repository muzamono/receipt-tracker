from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, Any


class ReceiptInfo(BaseModel):
    id: int
    file_path: Optional[str] = None

    class Config:
        from_attributes = True


class ReceiptResponse(BaseModel):
    id: int
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    merchant: Optional[str] = None
    expense_date: date
    total_amount: float
    currency: str = "MYR"
    category_id: Optional[int] = None
    payment_type_id: Optional[int] = None
    notes: Optional[str] = None
    line_items: Optional[Any] = None
    receipt_id: Optional[int] = None


class ExpenseResponse(ExpenseCreate):
    id: int
    receipt_id: Optional[int] = None
    receipt: Optional[ReceiptInfo] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    color: str = "#8A8780"


class PaymentTypeResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class PaymentTypeCreate(BaseModel):
    name: str