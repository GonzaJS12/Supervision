import { obtenerDb } from "./database";

export async function listarAgentesLocales() {
  const db = await obtenerDb();
  return db.getAllAsync<{
    id: number;
    nombre: string;
    apellido: string;
    sector_id: number | null;
    area_operativa_id: number;
    cobertura: string | null;
  }>("SELECT * FROM agentes ORDER BY apellido ASC, nombre ASC");
}

export async function listarRondasLocales() {
  const db = await obtenerDb();
  return db.getAllAsync<{ id: number; nombre: string }>(
    "SELECT * FROM rondas ORDER BY nombre ASC",
  );
}

export async function listarBloquesLocales() {
  const db = await obtenerDb();
  const bloques = await db.getAllAsync<{
    id: number;
    nombre: string;
    descripcion: string | null;
    orden: number;
  }>("SELECT * FROM bloques ORDER BY orden ASC");

  const criterios = await db.getAllAsync<{
    id: number;
    bloque_id: number;
    nombre: string;
    descripcion: string | null;
    orden: number;
  }>("SELECT * FROM criterios ORDER BY orden ASC");

  return bloques.map((bloque) => ({
    ...bloque,
    criterios: criterios.filter((item) => item.bloque_id === bloque.id),
  }));
}

export async function leerMeta(clave: string) {
  const db = await obtenerDb();
  const fila = await db.getFirstAsync<{ valor: string }>(
    "SELECT valor FROM meta WHERE clave = ?",
    [clave],
  );
  return fila?.valor ?? null;
}
