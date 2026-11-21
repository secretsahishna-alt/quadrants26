
CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sellers (name, locality, address)
VALUES
  ('Sharma Grocery', 'Koramangala', '80 Feet Road'),
  ('Fresh Fruits Corner', 'Koramangala', '5th Block'),
  ('City Stationery', 'Koramangala', '6th Block');

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    fulfillment_type VARCHAR(20) NOT NULL
        CHECK (fulfillment_type IN ('pickup', 'delivery')),
    delivery_address TEXT,
    total_paise INTEGER NOT NULL CHECK (total_paise >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'placed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_orders (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    seller_id INTEGER NOT NULL REFERENCES sellers(id),
    subtotal_paise INTEGER NOT NULL CHECK (subtotal_paise >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (order_id, seller_id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    seller_order_id INTEGER NOT NULL REFERENCES seller_orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
