CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO categories (name) VALUES
    ('Food'),
    ('Groceries'),
    ('Transport'),
    ('Shopping'),
    ('Utilities'),
    ('Healthcare'),
    ('Other');

CREATE TABLE receipts (
    id SERIAL PRIMARY KEY,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    file_name TEXT,
    file_path TEXT,
    raw_ai_response JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed'))
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    receipt_id INT REFERENCES receipts(id) ON DELETE SET NULL,
    merchant TEXT,
    expense_date DATE,
    total_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'MYR',
    category_id INT REFERENCES categories(id),
    notes TEXT,
    line_items JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);