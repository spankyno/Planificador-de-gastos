-- Baja de gastos desde un año, sin tocar el historial
ALTER TABLE expense_category ADD COLUMN archived_from_year INTEGER;
