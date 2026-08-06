# Receipt Tracker

A personal expense tracking app. Upload receipts, log expenses manually, and track monthly spending. Built with FastAPI, PostgreSQL, and React.

---

## Project Structure

```
receipt-tracker/
├── backend/
│   ├── extraction/
│   │   └── extract.py        # AI receipt extraction (Gemini/Ollama)
│   ├── database.py           # SQLAlchemy engine and session setup
│   ├── models.py             # SQLAlchemy table definitions
│   ├── schemas.py            # Pydantic request/response models
│   ├── main.py               # FastAPI app and routes
│   └── requirements.txt      # Python dependencies
├── frontend/
│   └── src/
│       ├── api/
│       │   └── client.js     # Axios base client
│       ├── components/
│       │   └── ExpenseForm.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   └── Expenses.jsx
│       ├── App.jsx
│       └── main.jsx
├── database/
│   └── init.sql              # Schema definition, runs on first Postgres startup
├── data/
│   └── samples/              # Test receipt images
├── docker-compose.yml
└── .env                      # API keys and credentials, never commit this
```

---

## Prerequisites

- Docker Desktop
- Python 3.10+ (via Miniconda or system Python)
- Node.js 18+

---

## Environment Variables

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_key_here
POSTGRES_DB=receipt_tracker
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin123
```

---

## Setup

### 1. Start the database

Run from `receipt-tracker/`:

```bash
docker-compose up -d
```

This starts Postgres on port `5433` and pgAdmin on port `5050`. The `database/init.sql` schema runs automatically on first startup.

Verify tables exist:

```bash
docker-compose exec postgres psql -U admin -d receipt_tracker -c "\dt"
```

### 2. pgAdmin (optional)

Open http://localhost:5050 and log in with the credentials from `.env`.

Register a server manually:
- Host: `postgres`
- Port: `5432`
- Database: `receipt_tracker`
- Username: `admin`
- Password: `admin123`

### 3. Install Python dependencies

Run from `receipt-tracker/backend/`:

```bash
pip install -r requirements.txt
```

`requirements.txt` contains:

```
fastapi
uvicorn
sqlalchemy
psycopg2-binary
python-dotenv
python-multipart
```

### 4. Start the backend

Run from `receipt-tracker/backend/`:

```bash
uvicorn main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### 5. Install frontend dependencies

Run from `receipt-tracker/frontend/`:

```bash
npm install
```

### 6. Start the frontend

Run from `receipt-tracker/frontend/`:

```bash
npm run dev
```

App available at http://localhost:5173

---

## Database Schema

Three tables:

**categories** — lookup table, seeded on first startup
- Food, Groceries, Transport, Shopping, Utilities, Healthcare, Other

**receipts** — one row per uploaded receipt file
- Stores file path and raw AI extraction response (JSONB)
- Status: `pending`, `processed`, or `failed`

**expenses** — one row per expense record
- Links to a receipt (optional) and a category
- Stores merchant, date, amount, currency, notes, and line items (JSONB)

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | List all categories |
| GET | `/expenses` | List all expenses |
| POST | `/expenses` | Create an expense |
| GET | `/expenses/{id}` | Get a single expense |
| DELETE | `/expenses/{id}` | Delete an expense |

---

## AI Receipt Extraction (Work in Progress)

`backend/extraction/extract.py` accepts an image path and returns structured JSON.

Run from `receipt-tracker/`:

```bash
python backend/extraction/extract.py data/samples/your_receipt.jpg
```

Supports `.jpg`, `.jpeg`, `.png`, `.webp`, and `.heic` (HEIC converted to JPEG in memory before sending).

Current status: AI extraction is deprioritized due to regional API quota limitations on the Gemini free tier and insufficient accuracy from local models (llava-phi3). Will be revisited via OpenRouter or a paid API.

---

## Running Everything

Open three terminal tabs:

| Tab | Directory | Command |
|-----|-----------|---------|
| 1 | `receipt-tracker/` | `docker-compose up -d` |
| 2 | `receipt-tracker/backend/` | `uvicorn main:app --reload --port 8000` |
| 3 | `receipt-tracker/frontend/` | `npm run dev` |

---

## Known Issues

- Local Postgres on port 5432 conflicts with the Docker container. If you have Postgres installed natively, either stop it (`brew services stop postgresql`) or change the Docker port mapping to `5433:5432` in `docker-compose.yml` and update the connection string in `database.py` accordingly.
- The `.env` file path must be hardcoded in `database.py` if relative path resolution fails. Update the `load_dotenv` line to use the absolute path to your `.env`.
