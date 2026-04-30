-- ThetaDhan D1 Schema
-- Cloudflare D1 (SQLite-compatible)

-- Dhan instrument master (synced daily from CSV)
CREATE TABLE IF NOT EXISTS instruments (
  security_id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  trading_symbol TEXT,
  exchange_segment TEXT NOT NULL,
  instrument_type TEXT,
  lot_size INTEGER DEFAULT 1,
  expiry_date TEXT,
  strike_price REAL,
  option_type TEXT
);
CREATE INDEX IF NOT EXISTS idx_inst_symbol ON instruments(symbol);
CREATE INDEX IF NOT EXISTS idx_inst_segment ON instruments(exchange_segment);
CREATE INDEX IF NOT EXISTS idx_inst_type ON instruments(instrument_type);
CREATE INDEX IF NOT EXISTS idx_inst_expiry ON instruments(expiry_date);

-- User watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  symbols TEXT DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- User settings (key-value JSON store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Trade journal (for personal tracking)
CREATE TABLE IF NOT EXISTS trade_journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  broker TEXT DEFAULT 'dhan',
  order_id TEXT,
  symbol TEXT,
  side TEXT,
  qty INTEGER,
  price REAL,
  order_type TEXT,
  product TEXT,
  status TEXT,
  pnl REAL,
  notes TEXT,
  traded_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tj_symbol ON trade_journal(symbol);
CREATE INDEX IF NOT EXISTS idx_tj_date ON trade_journal(traded_at);
