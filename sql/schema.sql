PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1))
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT,
  description TEXT,
  is_available INTEGER NOT NULL DEFAULT 1 CHECK(is_available IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- rules for discounts
CREATE TABLE IF NOT EXISTS discount_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL CHECK (scope IN ('item','category')),
  target_id INTEGER NOT NULL,
  percent INTEGER NOT NULL CHECK (percent BETWEEN 0 AND 100),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  starts_at INTEGER,
  ends_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_discount_scope_target ON discount_rules(scope, target_id);
CREATE INDEX IF NOT EXISTS ix_discount_active ON discount_rules(is_active);
CREATE INDEX IF NOT EXISTS ix_discount_time ON discount_rules(starts_at, ends_at);

-- daily featured / پیشنهاد روز
CREATE TABLE IF NOT EXISTS featured_items (
  item_id INTEGER NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_featured_active ON featured_items(is_active, sort_order);

-- feedback messages from customer
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_no INTEGER,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0,1)),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_code TEXT NOT NULL UNIQUE,
  table_no INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending_waiter','accepted_waiter','paid','rejected')),
  customer_note TEXT,
  subtotal_amount INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  reject_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  accepted_at INTEGER,
  paid_at INTEGER,
  rejected_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS ix_orders_status_time ON orders(status, created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  item_name_snapshot TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK(qty > 0),
  unit_price_snapshot INTEGER NOT NULL,
  discount_percent_snapshot INTEGER NOT NULL,
  final_unit_price_snapshot INTEGER NOT NULL,
  line_total_snapshot INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_order_items_order ON order_items(order_id);
