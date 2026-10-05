import type { PaqueteSync } from "@supervision/api-client";
import { repararTexto } from "@supervision/domain";
import { clienteApi } from "../api";
import { obtenerDb } from "../db/database";

function texto(valor: string | null | undefined) {
  if (valor == null) {
    return valor ?? null;
  }
  return repararTexto(valor) ?? valor;
}

export async function pullCatalogos() {
  const paquete = await clienteApi().pull();
  await guardarPaquete(paquete);
  return paquete;
}

export async function guardarPaquete(paquete: PaqueteSync) {
  const db = await obtenerDb();

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM supervisiones_remotas;
      DELETE FROM criterios;
      DELETE FROM bloques;
      DELETE FROM rondas;
      DELETE FROM agentes;
      DELETE FROM sectores;
    `);

    for (const sector of paquete.sectores) {
      await db.runAsync(
        "INSERT INTO sectores (id, numero, nombre) VALUES (?, ?, ?)",
        [sector.id, sector.numero, texto(sector.nombre)],
      );
    }

    for (const agente of paquete.agentes) {
      await db.runAsync(
        `INSERT INTO agentes (id, nombre, apellido, sector_id, area_operativa_id, cobertura)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          agente.id,
          texto(agente.nombre),
          texto(agente.apellido),
          agente.sectorId,
          agente.areaOperativaId,
          texto(agente.cobertura),
        ],
      );
    }

    for (const ronda of paquete.rondas) {
      await db.runAsync("INSERT INTO rondas (id, nombre) VALUES (?, ?)", [
        ronda.id,
        texto(ronda.nombre),
      ]);
    }

    for (const bloque of paquete.bloques) {
      await db.runAsync(
        "INSERT INTO bloques (id, nombre, descripcion, orden) VALUES (?, ?, ?, ?)",
        [bloque.id, texto(bloque.nombre), texto(bloque.descripcion), bloque.orden],
      );

      for (const criterio of bloque.criterios) {
        await db.runAsync(
          `INSERT INTO criterios (id, bloque_id, nombre, descripcion, orden)
           VALUES (?, ?, ?, ?, ?)`,
          [
            criterio.id,
            bloque.id,
            texto(criterio.nombre),
            texto(criterio.descripcion),
            criterio.orden,
          ],
        );
      }
    }

    await db.runAsync(
      "INSERT OR REPLACE INTO meta (clave, valor) VALUES (?, ?)",
      ["pulledAt", paquete.pulledAt],
    );

    for (const item of paquete.supervisiones ?? []) {
      const fecha =
        typeof item.fecha === "string"
          ? item.fecha
          : new Date(item.fecha).toISOString();

      await db.runAsync(
        `INSERT INTO supervisiones_remotas
         (id, fecha, promedio, clasificacion, decision_gestion, agente_id, agente_nombre, agente_apellido)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          fecha,
          item.promedio == null ? null : Number(item.promedio),
          item.clasificacion,
          item.decisionGestion,
          item.agenteSanitario.id,
          texto(item.agenteSanitario.nombre),
          texto(item.agenteSanitario.apellido),
        ],
      );
    }
  });
}
