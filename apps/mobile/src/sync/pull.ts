import type { PaqueteSync } from "@supervision/api-client";
import { clienteApi } from "../api";
import { obtenerDb } from "../db/database";

export async function pullCatalogos() {
  const paquete = await clienteApi().pull();
  await guardarPaquete(paquete);
  return paquete;
}

export async function guardarPaquete(paquete: PaqueteSync) {
  const db = await obtenerDb();

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM criterios;
      DELETE FROM bloques;
      DELETE FROM rondas;
      DELETE FROM agentes;
      DELETE FROM sectores;
    `);

    for (const sector of paquete.sectores) {
      await db.runAsync(
        "INSERT INTO sectores (id, numero, nombre) VALUES (?, ?, ?)",
        [sector.id, sector.numero, sector.nombre],
      );
    }

    for (const agente of paquete.agentes) {
      await db.runAsync(
        `INSERT INTO agentes (id, nombre, apellido, sector_id, area_operativa_id, cobertura)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          agente.id,
          agente.nombre,
          agente.apellido,
          agente.sectorId,
          agente.areaOperativaId,
          agente.cobertura,
        ],
      );
    }

    for (const ronda of paquete.rondas) {
      await db.runAsync("INSERT INTO rondas (id, nombre) VALUES (?, ?)", [
        ronda.id,
        ronda.nombre,
      ]);
    }

    for (const bloque of paquete.bloques) {
      await db.runAsync(
        "INSERT INTO bloques (id, nombre, descripcion, orden) VALUES (?, ?, ?, ?)",
        [bloque.id, bloque.nombre, bloque.descripcion, bloque.orden],
      );

      for (const criterio of bloque.criterios) {
        await db.runAsync(
          `INSERT INTO criterios (id, bloque_id, nombre, descripcion, orden)
           VALUES (?, ?, ?, ?, ?)`,
          [
            criterio.id,
            bloque.id,
            criterio.nombre,
            criterio.descripcion,
            criterio.orden,
          ],
        );
      }
    }

    await db.runAsync(
      "INSERT OR REPLACE INTO meta (clave, valor) VALUES (?, ?)",
      ["pulledAt", paquete.pulledAt],
    );
  });
}
