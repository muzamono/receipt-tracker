CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    color TEXT DEFAULT '#8A8780'
);

CREATE TABLE payment_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

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
    created_at TIMESTAMP DEFAULT NOW(),
    payment_type_id INT REFERENCES payment_types(id)
);

INSERT INTO categories (id, name, color) VALUES
    (1, 'Food', '#5B8A72'),
    (2, 'Groceries', '#7A9CC6'),
    (3, 'Transport', '#333333'),
    (4, 'Shopping', '#8A8780'),
    (5, 'Utilities', '#b51a00'),
    (6, 'Healthcare', '#8A8780'),
    (7, 'Leisures', '#D4B483'),
    (8, 'Travel', '#982abc');

INSERT INTO payment_types (id, name) VALUES
    (1, 'Cash'),
    (2, 'Credit Card'),
    (3, 'Debit Card'),
    (4, 'Online Banking'),
    (5, 'E-Wallet'),
    (6, 'Coupon');

-- Move the ID counters past the seeded rows
SELECT setval(pg_get_serial_sequence('categories', 'id'), 8, true);
SELECT setval(pg_get_serial_sequence('payment_types', 'id'), 6, true);