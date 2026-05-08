import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "leily.db");

// Ensure data directory exists
import { mkdirSync } from "fs";
mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db: DatabaseType = new Database(DB_PATH);

// Performance settings
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── Schema ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    full_name   TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS properties (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address         TEXT NOT NULL,
    city            TEXT,
    postal_code     TEXT,
    property_type   TEXT DEFAULT 'Leilighet',
    size_sqm        REAL,
    bedrooms        INTEGER,
    purchase_price  REAL,
    current_value   REAL,
    loan_amount     REAL DEFAULT 0,
    interest_rate   REAL DEFAULT 3.5,
    monthly_rent    REAL DEFAULT 0,
    image_url       TEXT,
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tenants (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leases (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id     TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    monthly_rent    REAL NOT NULL,
    deposit         REAL DEFAULT 0,
    start_date      TEXT NOT NULL,
    end_date        TEXT NOT NULL,
    status          TEXT DEFAULT 'active' CHECK(status IN ('active','expired','terminated')),
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
    lease_id    TEXT REFERENCES leases(id) ON DELETE SET NULL,
    type        TEXT NOT NULL CHECK(type IN ('income','expense')),
    category    TEXT NOT NULL,
    amount      REAL NOT NULL,
    description TEXT,
    date        TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lease_id    TEXT NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    sender      TEXT NOT NULL CHECK(sender IN ('landlord','tenant')),
    content     TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    lease_id    TEXT REFERENCES leases(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    file_type   TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
  CREATE INDEX IF NOT EXISTS idx_leases_owner ON leases(owner_id);
  CREATE INDEX IF NOT EXISTS idx_leases_property ON leases(property_id);
  CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_owner ON transactions(owner_id);
  CREATE INDEX IF NOT EXISTS idx_messages_lease ON messages(lease_id);
`);

export default db;
