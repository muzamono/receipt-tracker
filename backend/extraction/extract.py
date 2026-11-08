import os
import io
import json
from pathlib import Path
from typing import List, Optional, Literal
from dotenv import load_dotenv
from PIL import Image, ImageOps
import pillow_heif
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# Register HEIC image format support for PIL
pillow_heif.register_heif_opener()

# Explicitly load .env from the root receipt-tracker/ directory
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(ENV_PATH)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError(f"GEMINI_API_KEY not found in environment or at {ENV_PATH}")


# ------------------------------------------------------------------
# 1. Output Schema Definition (Pydantic)
# ------------------------------------------------------------------
class LineItem(BaseModel):
    name: str = Field(description="Item name or description")
    quantity: Optional[float] = Field(default=1.0, description="Quantity purchased")
    unit_price: Optional[float] = Field(default=None, description="Price per individual unit")
    total: float = Field(description="Total price for this line item")


class ReceiptData(BaseModel):
    merchant: Optional[str] = Field(default=None, description="Store or restaurant name")
    date: Optional[str] = Field(default=None, description="Transaction date in YYYY-MM-DD format")
    total_amount: float = Field(description="Final total amount paid")
    currency: str = Field(default="MYR", description="3-letter currency code (e.g. MYR, USD)")
    category: str = Field(
        description="One of: Food, Groceries, Transport, Shopping, Utilities, Healthcare, Other"
    )
    line_items: List[LineItem] = Field(default=[], description="List of purchased items")
    extraction_confidence: Literal["high", "medium", "low"] = Field(
        default="high", description="Confidence level of the extracted data"
    )


# ------------------------------------------------------------------
# 2. Image Pre-processing Helper
# ------------------------------------------------------------------
def prepare_image(image_input: str | Path | bytes | Image.Image, max_dim: int = 1536) -> Image.Image:
    """Loads, corrects EXIF rotation, resizes, and compresses image in memory."""
    if isinstance(image_input, Image.Image):
        img = image_input
    elif isinstance(image_input, (str, Path)):
        img = Image.open(image_input)
    elif isinstance(image_input, bytes):
        img = Image.open(io.BytesIO(image_input))
    else:
        raise ValueError("Unsupported image input type")

    # Correct phone camera EXIF orientation
    img = ImageOps.exif_transpose(img)

    # Convert to RGB mode (handles PNG alpha channel / HEIC palettes)
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")

    # Rescale down to 1536 max dimension preserving aspect ratio
    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

    # Save compressed JPEG to BytesIO stream
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85, optimize=True)
    buffer.seek(0)

    return Image.open(buffer)


# ------------------------------------------------------------------
# 3. Main Extraction Service
# ------------------------------------------------------------------
def extract_receipt(image_input: str | Path | bytes | Image.Image) -> dict:
    client = genai.Client(api_key=API_KEY)

    prompt = """
    Analyze this receipt and extract the requested fields.
    - Return ONLY valid information found on the receipt.
    - Normalize dates to YYYY-MM-DD.
    - Default currency to MYR if unclear.
    """

    # Detect PDF by magic bytes or file extension
    is_pdf = False
    if isinstance(image_input, (str, Path)):
        is_pdf = str(image_input).lower().endswith('.pdf')
    elif isinstance(image_input, bytes):
        is_pdf = image_input[:4] == b'%PDF'

    if is_pdf:
        pdf_bytes = image_input if isinstance(image_input, bytes) else Path(image_input).read_bytes()
        content_part = types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")
    else:
        processed_img = prepare_image(image_input)
        content_part = processed_img

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=[content_part, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ReceiptData,
            temperature=0.1,
        ),
    )

    parsed_data: ReceiptData = response.parsed
    return parsed_data.model_dump()

# ------------------------------------------------------------------
# 4. Command Line Interface Execution
# ------------------------------------------------------------------
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python backend/extraction/extract.py <path_to_receipt_image>")
        sys.exit(1)

    image_path = sys.argv[1]
    result = extract_receipt(image_path)
    print(json.dumps(result, indent=2))