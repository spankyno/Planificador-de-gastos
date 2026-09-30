-- El tipo (FIJO/VARIABLE/DISCRECIONAL) pasa de la familia al gasto
ALTER TABLE expense_category ADD COLUMN type TEXT CHECK (type IN ('FIJO','VARIABLE','DISCRECIONAL'));
-- Punto de partida: cada gasto hereda el tipo de su familia; después se ajusta gasto a gasto en la app
UPDATE expense_category
SET type = (SELECT f.type FROM family f WHERE f.id = expense_category.family_id)
WHERE type IS NULL;
