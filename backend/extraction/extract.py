import os
import io
import json
import base64
from pathlib import Path
from dotenv import load_dotenv
import ollama
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

load_dotenv(Path(__file__).parent.parent.parent / ".env")

EXTRACTION_PROMPT = """
You are a receipt data extraction assistant.

Analyze the receipt image and return ONLY a valid JSON object with this exact structure:

{
  "merchant": "store or restaurant name",
  "date": "YYYY-MM-DD",
  "total_amount": 0.00,
  "currency": "MYR",
  "category": "one of: Food, Groceries, Transport, Shopping, Utilities, Healthcare, Other",
  "line_items": [
    {"name": "item name", "quantity": 1, "unit_price": 0.00, "total": 0.00}
  ],
  "extraction_confidence": "high, medium, or low"
}

Rules:
- Return ONLY the JSON, no explanation, no markdown, no code fences
- If a field cannot be determined, use null
- Date must be in YYYY-MM-DD format
- Amounts must be numbers, not strings
- currency should reflect what is on the receipt, default to MYR if unclear
"""


def encode_image(image_path: str) -> tuple[str, str]:
    path = Path(image_path)
    suffix = path.suffix.lower()

    if suffix == ".heic":
        image = Image.open(image_path)
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        image_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return image_data, "image/jpeg"

    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }

    mime_type = mime_types.get(suffix)
    if not mime_type:
        raise ValueError(f"Unsupported file type: {suffix}")

    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    return image_data, mime_type


def extract_receipt(image_path: str) -> dict:
    image_data, mime_type = encode_image(image_path)

    response = ollama.chat(
        model="llava-phi3",
        messages=[
            {
                "role": "user",
                "content": EXTRACTION_PROMPT,
                "images": [base64.b64decode(image_data)]
            }
        ]
    )

    raw_text = response["message"]["content"].strip()

    try:
        result = json.loads(raw_text)
    except json.JSONDecodeError:
        result = {
            "error": "failed to parse AI response",
            "raw_response": raw_text
        }

    return result


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python extract.py <path_to_receipt_image>")
        sys.exit(1)

    image_path = sys.argv[1]
    result = extract_receipt(image_path)
    print(json.dumps(result, indent=2))