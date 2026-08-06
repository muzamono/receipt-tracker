from sqlalchemy import Column, Integer, Text, Numeric, Date, ForeignKey, TIMESTAMP, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False, unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    color = Column(Text, default="#8A8780")


class PaymentType(Base):
    __tablename__ = "payment_types"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False, unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True)
    uploaded_at = Column(TIMESTAMP, server_default=func.now())
    file_name = Column(Text)
    file_path = Column(Text)
    raw_ai_response = Column(JSONB)
    status = Column(Text, default="pending")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id", ondelete="SET NULL"), nullable=True)
    merchant = Column(Text)
    expense_date = Column(Date)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(Text, default="MYR")
    category_id = Column(Integer, ForeignKey("categories.id"))
    payment_type_id = Column(Integer, ForeignKey("payment_types.id"))
    notes = Column(Text)
    line_items = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default=func.now())

    receipt = relationship("Receipt")