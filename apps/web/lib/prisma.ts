import { PrismaClient } from "@prisma/client";

function urlPostgres(url: string) {
  let lista = url;

  if (
    (lista.includes("supabase.com") || lista.includes("supabase.co")) &&
    !lista.includes("sslmode=")
  ) {
    lista += lista.includes("?") ? "&sslmode=require" : "?sslmode=require";
  }

  if (lista.includes(":6543/") && !lista.includes("connection_limit=")) {
    lista += lista.includes("?") ? "&connection_limit=1" : "?connection_limit=1";
  }

  return lista;
}

export function resumenDatabaseUrl() {
  const cruda = process.env.DATABASE_URL?.trim();

  if (!cruda) {
    return {
      tieneDatabaseUrl: false,
      host: null as string | null,
      puerto: null as string | null,
    };
  }

  try {
    const parsed = new URL(cruda.replace(/^postgres(?:ql)?:/, "https:"));
    return {
      tieneDatabaseUrl: true,
      host: parsed.hostname,
      puerto: parsed.port || "5432",
    };
  } catch {
    return {
      tieneDatabaseUrl: true,
      host: "url-invalida",
      puerto: null as string | null,
    };
  }
}

const globalForPrisma = globalThis as unknown as {
  prismaWeb?: PrismaClient;
};

function crearPrisma() {
  const cruda = process.env.DATABASE_URL?.trim();

  if (!cruda) {
    throw new Error("DATABASE_URL no está configurada");
  }

  return new PrismaClient({
    datasources: {
      db: { url: urlPostgres(cruda) },
    },
  });
}

export const prisma = globalForPrisma.prismaWeb ?? crearPrisma();
globalForPrisma.prismaWeb = prisma;
