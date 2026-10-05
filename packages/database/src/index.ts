import path from "node:path";
import { existsSync } from "node:fs";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { repararTexto } from "@supervision/domain";

const posiblesEnv = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), "../.env"),
];

for (const archivo of posiblesEnv) {
  if (existsSync(archivo)) {
    config({ path: archivo });
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prismaBase =
  globalForPrisma.prisma ??
  new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : undefined,
  );

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaBase;
}

function campoReq<K extends string>(nombre: K) {
  return {
    needs: { [nombre]: true } as { [P in K]: true },
    compute(fila: { [P in K]: string }) {
      return repararTexto(fila[nombre]) ?? fila[nombre];
    },
  };
}

function campoOpt<K extends string>(nombre: K) {
  return {
    needs: { [nombre]: true } as { [P in K]: true },
    compute(fila: { [P in K]: string | null }) {
      const valor = repararTexto(fila[nombre]);
      return valor === undefined ? null : valor;
    },
  };
}

export const prisma = prismaBase.$extends({
  result: {
    usuario: {
      nombre: campoReq("nombre"),
      apellido: campoReq("apellido"),
    },
    zona: {
      nombre: campoReq("nombre"),
    },
    areaOperativa: {
      nombre: campoReq("nombre"),
      descripcion: campoOpt("descripcion"),
      estabBase: campoOpt("estabBase"),
    },
    sector: {
      nombre: campoOpt("nombre"),
      cobertura: campoOpt("cobertura"),
    },
    agenteSanitario: {
      nombre: campoReq("nombre"),
      apellido: campoReq("apellido"),
      cobertura: campoOpt("cobertura"),
    },
    ronda: {
      nombre: campoReq("nombre"),
    },
    bloqueEvaluacion: {
      nombre: campoReq("nombre"),
      descripcion: campoOpt("descripcion"),
    },
    criterioEvaluacion: {
      nombre: campoReq("nombre"),
      descripcion: campoOpt("descripcion"),
    },
    evaluacionCriterio: {
      criterioNombre: campoReq("criterioNombre"),
      criterioDescripcion: campoOpt("criterioDescripcion"),
    },
    supervision: {
      fortalezas: campoOpt("fortalezas"),
      oportunidadesMejora: campoOpt("oportunidadesMejora"),
      situacionesCriticas: campoOpt("situacionesCriticas"),
      recomendaciones: campoOpt("recomendaciones"),
    },
  },
});

export { PrismaClient };
