-- Familias y gastos globales (user_id NULL). Idempotente.
INSERT OR IGNORE INTO family (id, name, type, user_id) VALUES
 ('fam-vivienda','Vivienda','FIJO',NULL),
 ('fam-transporte','Transporte','VARIABLE',NULL),
 ('fam-alimentacion','Alimentación','VARIABLE',NULL),
 ('fam-ocio','Ocio y suscripciones','DISCRECIONAL',NULL);

INSERT OR IGNORE INTO expense_category (id, name, family_id, user_id) VALUES
 ('cat-alquiler','Alquiler / Hipoteca','fam-vivienda',NULL),
 ('cat-luz','Luz y agua','fam-vivienda',NULL),
 ('cat-seguros','Seguros','fam-vivienda',NULL),
 ('cat-combustible','Combustible','fam-transporte',NULL),
 ('cat-supermercado','Supermercado','fam-alimentacion',NULL),
 ('cat-restaurantes','Restaurantes','fam-ocio',NULL),
 ('cat-streaming','Streaming','fam-ocio',NULL),
 ('cat-viajes','Viajes','fam-ocio',NULL);
