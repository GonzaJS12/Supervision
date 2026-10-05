import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { repararTexto } from "@supervision/domain";

const raiz = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

config({ path: path.join(raiz, ".env") });

const url =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!url) {
  throw new Error("Falta DATABASE_URL o DIRECT_URL");
}

const prisma = new PrismaClient({
  datasources: { db: { url } },
});

function mapaReparado(
  fila: Record<string, unknown>,
  claves: string[],
) {
  const cambios: Record<string, string | null> = {};
  for (const clave of claves) {
    const actual = fila[clave];
    if (typeof actual !== "string") {
      continue;
    }
    const reparado = repararTexto(actual);
    if (typeof reparado === "string" && reparado !== actual) {
      cambios[clave] = reparado;
    }
  }
  return cambios;
}

async function main() {
  let actualizados = 0;

  const agentes = await prisma.agenteSanitario.findMany();
  for (const fila of agentes) {
    const cambios = mapaReparado(fila, ["nombre", "apellido", "cobertura"]);
    if (Object.keys(cambios).length > 0) {
      await prisma.agenteSanitario.update({
        where: { id: fila.id },
        data: cambios,
      });
      actualizados += 1;
    }
  }

  const usuarios = await prisma.usuario.findMany();
  for (const fila of usuarios) {
    const cambios = mapaReparado(fila, ["nombre", "apellido"]);
    if (Object.keys(cambios).length > 0) {
      await prisma.usuario.update({
        where: { id: fila.id },
        data: cambios,
      });
      actualizados += 1;
    }
  }

  const zonas = await prisma.zona.findMany();
  for (const fila of zonas) {
    const cambios = mapaReparado(fila, ["nombre"]);
    if (Object.keys(cambios).length > 0) {
      await prisma.zona.update({ where: { id: fila.id }, data: cambios });
      actualizados += 1;
    }
  }

  const areas = await prisma.areaOperativa.findMany();
  for (const fila of areas) {
    const cambios = mapaReparado(fila, [
      "nombre",
      "descripcion",
      "estabBase",
    ]);
    if (Object.keys(cambios).length > 0) {
      await prisma.areaOperativa.update({
        where: { id: fila.id },
        data: cambios,
      });
      actualizados += 1;
    }
  }

  const sectores = await prisma.sector.findMany();
  for (const fila of sectores) {
    const cambios = mapaReparado(fila, ["nombre", "cobertura"]);
    if (Object.keys(cambios).length > 0) {
      await prisma.sector.update({ where: { id: fila.id }, data: cambios });
      actualizados += 1;
    }
  }

  const rondas = await prisma.ronda.findMany();
  for (const fila of rondas) {
    const cambios = mapaReparado(fila, ["nombre"]);
    if (Object.keys(cambios).length > 0) {
      await prisma.ronda.update({ where: { id: fila.id }, data: cambios });
      actualizados += 1;
    }
  }

  const evaluaciones = await prisma.evaluacionCriterio.findMany();
  for (const fila of evaluaciones) {
    const cambios = mapaReparado(fila, [
      "criterioNombre",
      "criterioDescripcion",
    ]);
    if (Object.keys(cambios).length > 0) {
      await prisma.evaluacionCriterio.update({
        where: { id: fila.id },
        data: cambios,
      });
      actualizados += 1;
    }
  }

  const supervisiones = await prisma.supervision.findMany();
  for (const fila of supervisiones) {
    const cambios = mapaReparado(fila, [
      "fortalezas",
      "oportunidadesMejora",
      "situacionesCriticas",
      "recomendaciones",
    ]);
    if (Object.keys(cambios).length > 0) {
      await prisma.supervision.update({
        where: { id: fila.id },
        data: cambios,
      });
      actualizados += 1;
    }
  }

  console.log(`Registros con texto corregido: ${actualizados}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
