import csv
import io
import shutil
from uuid import uuid4
from pathlib import Path
from typing import List, Optional
from datetime import date

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import extract
from sqlalchemy.orm import Session
from PIL import Image
import pillow_heif

from database import get_db
from models import Expense, Category, Receipt, PaymentType
from schemas import (
    ExpenseCreate, ExpenseResponse,
    CategoryResponse, CategoryCreate,
    PaymentTypeResponse, PaymentTypeCreate,
    ReceiptResponse
)

pillow_heif.register_heif_opener()

UPLOAD_DIR = Path(__file__).parent.parent / "data" / "receipts"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"


class SPAStaticFiles(StaticFiles):
    """Serve built frontend files; unknown paths without a file extension get index.html."""

    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as ex:
            if ex.status_code == 404 and "." not in Path(path).name:
                return await super().get_response("index.html", scope)
            raise


# All API routes live on this sub-app, mounted at /api
api = FastAPI(title="Receipt Tracker API")
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api.mount("/receipt-images", StaticFiles(directory=str(UPLOAD_DIR)), name="receipt-images")


@api.get("/health")
def health():
    return {"status": "running"}


@api.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


@api.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    record = Category(name=category.name, color=category.color)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@api.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category: CategoryCreate, db: Session = Depends(get_db)):
    record = db.query(Category).filter(Category.id == category_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Category not found")
    record.name = category.name
    record.color = category.color
    db.commit()
    db.refresh(record)
    return record


@api.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    record = db.query(Category).filter(Category.id == category_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(record)
    db.commit()
    return {"deleted": category_id}


@api.get("/payment-types", response_model=List[PaymentTypeResponse])
def get_payment_types(db: Session = Depends(get_db)):
    return db.query(PaymentType).all()


@api.post("/payment-types", response_model=PaymentTypeResponse)
def create_payment_type(payment_type: PaymentTypeCreate, db: Session = Depends(get_db)):
    record = PaymentType(name=payment_type.name)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@api.put("/payment-types/{payment_type_id}", response_model=PaymentTypeResponse)
def update_payment_type(payment_type_id: int, payment_type: PaymentTypeCreate, db: Session = Depends(get_db)):
    record = db.query(PaymentType).filter(PaymentType.id == payment_type_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Payment type not found")
    record.name = payment_type.name
    db.commit()
    db.refresh(record)
    return record


@api.delete("/payment-types/{payment_type_id}")
def delete_payment_type(payment_type_id: int, db: Session = Depends(get_db)):
    record = db.query(PaymentType).filter(PaymentType.id == payment_type_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Payment type not found")
    db.delete(record)
    db.commit()
    return {"deleted": payment_type_id}


@api.post("/receipts/upload", response_model=ReceiptResponse)
def upload_receipt(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = Path(file.filename).suffix.lower()
    file_id = str(uuid4())

    if ext == ".heic":
        image = Image.open(file.file)
        filename = f"{file_id}.jpg"
        image.save(UPLOAD_DIR / filename, "JPEG")
    else:
        filename = f"{file_id}{ext}"
        with open(UPLOAD_DIR / filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    record = Receipt(file_name=file.filename, file_path=filename, status="pending")
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@api.post("/receipts/extract")
async def extract_receipt_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Read bytes once for both saving and extraction
    file_bytes = await file.read()
    ext = Path(file.filename).suffix.lower()
    file_id = str(uuid4())

    # Save file to disk
    if ext == ".heic":
        image = Image.open(io.BytesIO(file_bytes))
        filename = f"{file_id}.jpg"
        image.save(UPLOAD_DIR / filename, "JPEG")
    else:
        filename = f"{file_id}{ext}"
        with open(UPLOAD_DIR / filename, "wb") as buffer:
            buffer.write(file_bytes)

    # Create receipt record
    receipt = Receipt(file_name=file.filename, file_path=filename, status="pending")
    db.add(receipt)
    db.commit()
    db.refresh(receipt)

    # Run Gemini extraction
    from extraction.extract import extract_receipt
    extracted = extract_receipt(file_bytes)

    # Map category name → category_id (case-insensitive)
    category_id = None
    if extracted.get("category"):
        category = db.query(Category).filter(
            Category.name.ilike(extracted["category"])
        ).first()
        if category:
            category_id = category.id

    return {
        "receipt_id": receipt.id,
        "extracted": {
            **extracted,
            "category_id": category_id,
        }
    }

@api.post("/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    record = Expense(**expense.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@api.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).order_by(Expense.expense_date.desc()).all()


@api.get("/expenses/export/csv")
def export_expenses_csv(year: Optional[int] = None, month: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Expense)

    if year is not None and month is not None:
        query = query.filter(
            extract('year', Expense.expense_date) == year,
            extract('month', Expense.expense_date) == month + 1
        )
        month_name = date(year, month + 1, 1).strftime("%B")
        filename = f"{month_name}-{year}-expenses.csv"
    else:
        filename = "receipt-tracker-expenses.csv"

    expenses = query.order_by(Expense.expense_date.desc()).all()
    categories = {c.id: c.name for c in db.query(Category).all()}
    payment_types = {p.id: p.name for p in db.query(PaymentType).all()}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Merchant", "Category", "Payment Type", "Amount", "Currency", "Notes"])

    for e in expenses:
        writer.writerow([
            e.expense_date,
            e.merchant or "",
            categories.get(e.category_id, ""),
            payment_types.get(e.payment_type_id, ""),
            e.total_amount,
            e.currency,
            e.notes or ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@api.get("/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    record = db.query(Expense).filter(Expense.id == expense_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Expense not found")
    return record


@api.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    record = db.query(Expense).filter(Expense.id == expense_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(record)
    db.commit()
    return {"deleted": expense_id}


@api.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense: ExpenseCreate, db: Session = Depends(get_db)):
    record = db.query(Expense).filter(Expense.id == expense_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in expense.model_dump().items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


# Root app: API under /api, then the built frontend for everything else (must be last)
app = FastAPI(title="Receipt Tracker")
app.mount("/api", api)

if FRONTEND_DIR.exists():
    app.mount("/", SPAStaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")