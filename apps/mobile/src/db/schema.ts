/*
 * Catálogo local del área del supervisor
 * y supervisiones pendientes de enviar.
 * PostgreSQL sigue siendo la fuente de verdad.
 */

export const SQL_ESQUEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS meta (
  clave TEXT PRIMARY KEY NOT NULL,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sectores (
  id INTEGER PRIMARY KEY NOT NULL,
  numero INTEGER NOT NULL,
  nombre TEXT
);

CREATE TABLE IF NOT EXISTS agentes (
  id INTEGER PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  sector_id INTEGER,
  area_operativa_id INTEGER NOT NULL,
  cobertura TEXT
);

CREATE TABLE IF NOT EXISTS rondas (
  id INTEGER PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bloques (
  id INTEGER PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS criterios (
  id INTEGER PRIMARY KEY NOT NULL,
  bloque_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pendientes (
  local_id TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  estado TEXT NOT NULL,
  error TEXT,
  remote_id INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS supervisiones_remotas (
  id INTEGER PRIMARY KEY NOT NULL,
  fecha TEXT NOT NULL,
  promedio REAL,
  clasificacion TEXT,
  decision_gestion TEXT,
  agente_id INTEGER,
  agente_nombre TEXT,
  agente_apellido TEXT
);
`;
