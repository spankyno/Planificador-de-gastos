-- Bajas por usuario (familias y gastos, propios o por defecto)
CREATE TABLE IF NOT EXISTS item_archive (
  user_id   TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('family','category')),
  item_id   TEXT NOT NULL,
  from_year INTEGER NOT NULL,
  PRIMARY KEY (user_id, item_type, item_id)
);
-- Traslada las bajas de 0001 (columna archived_from_year), que deja de usarse
INSERT OR IGNORE INTO item_archive (user_id, item_type, item_id, from_year)
SELECT user_id, 'category', id, archived_from_year
FROM expense_category
WHERE archived_from_year IS NOT NULL AND user_id IS NOT NULL;
