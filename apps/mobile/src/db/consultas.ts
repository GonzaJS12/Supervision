import { repararTexto } from "@supervision/domain";
import { obtenerDb } from "./database";

function texto(valor: string): string {
  return repararTexto(valor) ?? valor;
}

function textoOpcional(valor: string | null): string | null {
  if (valor == null) {
    return null;
  }
  return repararTexto(valor) ?? valor;
}

export async function listarAgentesLocales() {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{
    id: number;
    nombre: string;
    apellido: string;
    sector_id: number | null;
    area_operativa_id: number;
    cobertura: string | null;
  }>("SELECT * FROM agentes ORDER BY apellido ASC, nombre ASC");

  return filas.map((fila) => ({
    ...fila,
    nombre: texto(fila.nombre),
    apellido: texto(fila.apellido),
    cobertura: textoOpcional(fila.cobertura),
  }));
}

export async function listarSectoresLocales() {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{
    id: number;
    numero: number;
    nombre: string | null;
  }>("SELECT * FROM sectores ORDER BY numero ASC");

  return filas.map((fila) => ({
    ...fila,
    nombre: textoOpcional(fila.nombre),
  }));
}

export async function listarRondasLocales() {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{ id: number; nombre: string }>(
    "SELECT * FROM rondas ORDER BY rowid ASC",
  );
  return filas.map((fila) => ({ ...fila, nombre: texto(fila.nombre) }));
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
    nombre: texto(bloque.nombre),
    descripcion: textoOpcional(bloque.descripcion),
    criterios: criterios
      .filter((item) => item.bloque_id === bloque.id)
      .map((criterio) => ({
        ...criterio,
        nombre: texto(criterio.nombre),
        descripcion: textoOpcional(criterio.descripcion),
      })),
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

export async function buscarAgenteLocal(id: number) {
  const db = await obtenerDb();
  const fila = await db.getFirstAsync<{
    id: number;
    nombre: string;
    apellido: string;
    sector_id: number | null;
    area_operativa_id: number;
    cobertura: string | null;
  }>("SELECT * FROM agentes WHERE id = ?", [id]);

  if (!fila) {
    return null;
  }

  return {
    ...fila,
    nombre: texto(fila.nombre),
    apellido: texto(fila.apellido),
    cobertura: textoOpcional(fila.cobertura),
  };
}

export async function listarSupervisionesPorAgenteLocal(agenteId: number) {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{
    id: number;
    fecha: string;
    promedio: number | null;
    clasificacion: string | null;
    decision_gestion: string;
    agente_nombre: string;
    agente_apellido: string;
  }>(
    "SELECT * FROM supervisiones_remotas WHERE agente_id = ? ORDER BY fecha DESC, id DESC",
    [agenteId],
  );

  return filas.map((fila) => ({
    ...fila,
    agente_nombre: texto(fila.agente_nombre),
    agente_apellido: texto(fila.agente_apellido),
  }));
}

export async function listarSupervisionesRemotas() {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{
    id: number;
    fecha: string;
    promedio: number | null;
    clasificacion: string | null;
    decision_gestion: string;
    agente_nombre: string;
    agente_apellido: string;
  }>(
    "SELECT * FROM supervisiones_remotas ORDER BY fecha DESC, id DESC",
  );

  return filas.map((fila) => ({
    ...fila,
    agente_nombre: texto(fila.agente_nombre),
    agente_apellido: texto(fila.agente_apellido),
  }));
}
