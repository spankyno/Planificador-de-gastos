-- Migración inicial (equivale al esquema de src/db/schema.ts)
CREATE TABLE IF NOT EXISTS user_preference (
  user_id    TEXT PRIMARY KEY NOT NULL,
  currency   TEXT NOT NULL DEFAULT 'EUR',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS family (
  id      TEXT PRIMARY KEY NOT NULL,
  name    TEXT NOT NULL,
  type    TEXT NOT NULL CHECK (type IN ('FIJO','VARIABLE','DISCRECIONAL')),
  user_id TEXT
);

CREATE TABLE IF NOT EXISTS expense_category (
  id        TEXT PRIMARY KEY NOT NULL,
  name      TEXT NOT NULL,
  family_id TEXT NOT NULL REFERENCES family(id),
  user_id   TEXT
);

CREATE TABLE IF NOT EXISTS expense_monthly_entry (
  id                  TEXT PRIMARY KEY NOT NULL,
  expense_category_id TEXT NOT NULL REFERENCES expense_category(id),
  year                INTEGER NOT NULL,
  month               INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount              REAL NOT NULL DEFAULT 0,
  user_id             TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_cell
  ON expense_monthly_entry (user_id, expense_category_id, year, month);
CREATE INDEX IF NOT EXISTS idx_user_year
  ON expense_monthly_entry (user_id, year);
CREATE INDEX IF NOT EXISTS idx_family_user ON family (user_id);
CREATE INDEX IF NOT EXISTS idx_category_family ON expense_category (family_id);
