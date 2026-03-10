import Database from "better-sqlite3"

const db = new Database("tracker.db")

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'group',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS creatives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    target_url TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    target_url TEXT,
    fallback_url TEXT DEFAULT 'https://google.com',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    category_id INTEGER,
    tds_category_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (tds_category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    stream_id INTEGER NOT NULL,
    creative_id INTEGER,
    ip TEXT,
    user_agent TEXT,
    referer TEXT,
    is_bot INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (stream_id) REFERENCES streams(id),
    FOREIGN KEY (creative_id) REFERENCES creatives(id)
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    click_uuid TEXT NOT NULL,
    payout REAL,
    status TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (click_uuid) REFERENCES clicks(uuid)
  );
`)

export default db
