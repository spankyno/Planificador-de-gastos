-- Año cerrado (candado): sin fila = abierto; con fila = cerrado
CREATE TABLE IF NOT EXISTS year_lock (
  user_id TEXT NOT NULL,
  year    INTEGER NOT NULL,
  PRIMARY KEY (user_id, year)
);
