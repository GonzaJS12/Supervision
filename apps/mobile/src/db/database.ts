import * as SQLite from "expo-sqlite";
import { SQL_ESQUEMA } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;

export async function obtenerDb() {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync("supervision_aps.db");
  await db.execAsync(SQL_ESQUEMA);

  try {
    await db.execAsync("ALTER TABLE agentes ADD COLUMN cobertura TEXT");
  } catch {
    /*
     * La columna ya existe en bases nuevas.
     */
  }

  await db.execAsync(`
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
  `);

  return db;
}
