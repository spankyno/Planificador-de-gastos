-- Familias y gastos globales (user_id NULL). Idempotente.
INSERT OR IGNORE INTO family (id, name, type, user_id) VALUES
 ('fam-vivienda','Vivienda','VARIABLE',NULL),
 ('fam-transporte','Transporte','VARIABLE',NULL),
 ('fam-alimentacion','Alimentación','VARIABLE',NULL),
 ('fam-ocio','Ocio y suscripciones','VARIABLE',NULL);

INSERT OR IGNORE INTO expense_category (id, name, family_id, user_id, type) VALUES
 ('cat-alquiler','Alquiler / Hipoteca','fam-vivienda',NULL,'FIJO'),
 ('cat-luz','Luz y agua','fam-vivienda',NULL,'VARIABLE'),
 ('cat-seguros','Seguros','fam-vivienda',NULL,'FIJO'),
 ('cat-combustible','Combustible','fam-transporte',NULL,'VARIABLE'),
 ('cat-supermercado','Supermercado','fam-alimentacion',NULL,'VARIABLE'),
 ('cat-restaurantes','Restaurantes','fam-ocio',NULL,'DISCRECIONAL'),
 ('cat-streaming','Streaming','fam-ocio',NULL,'DISCRECIONAL'),
 ('cat-viajes','Viajes','fam-ocio',NULL,'DISCRECIONAL');
