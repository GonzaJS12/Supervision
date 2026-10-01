import type { PendienteSync } from "@supervision/api-client";
import { clienteApi } from "../api";
import { obtenerDb } from "../db/database";

export async function listarPendientes(): Promise<
  Array<{ localId: string; estado: string; error: string | null; payload: PendienteSync }>
> {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<{
    local_id: string;
    payload: string;
    estado: string;
    error: string | null;
  }>("SELECT local_id, payload, estado, error FROM pendientes ORDER BY created_at DESC");

  return filas.map((fila) => ({
    localId: fila.local_id,
    estado: fila.estado,
    error: fila.error,
    payload: JSON.parse(fila.payload) as PendienteSync,
  }));
}

export async function guardarPendiente(payload: PendienteSync) {
  const db = await obtenerDb();
  await db.runAsync(
    `INSERT INTO pendientes (local_id, payload, estado, error, created_at)
     VALUES (?, ?, 'pendiente', NULL, ?)`,
    [payload.localId, JSON.stringify(payload), new Date().toISOString()],
  );
}

export async function pushSupervisionesPendientes() {
  const pendientes = (await listarPendientes()).filter(
    (item) => item.estado !== "sincronizada",
  );

  if (pendientes.length === 0) {
    return { enviados: 0, errores: 0 };
  }

  const { resultados } = await clienteApi().push(
    pendientes.map((item) => item.payload),
  );

  const db = await obtenerDb();
  let enviados = 0;
  let errores = 0;

  for (const resultado of resultados) {
    if (resultado.ok) {
      enviados += 1;
      await db.runAsync(
        `UPDATE pendientes
         SET estado = 'sincronizada', error = NULL, remote_id = ?
         WHERE local_id = ?`,
        [resultado.remoteId ?? null, resultado.localId],
      );
    } else {
      errores += 1;
      await db.runAsync(
        `UPDATE pendientes SET estado = 'error', error = ? WHERE local_id = ?`,
        [resultado.error ?? "Error", resultado.localId],
      );
    }
  }

  return { enviados, errores };
}
