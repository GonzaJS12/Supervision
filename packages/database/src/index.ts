import path from "node:path";
import { existsSync } from "node:fs";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

if (process.env.VERCEL !== "1") {
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
}

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

function urlDesdeEntorno() {
  const cruda = process.env["DATABASE_URL"]?.trim();
  return cruda ? urlPostgres(cruda) : undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function crearPrisma() {
  const urlConexion = urlDesdeEntorno();

  return new PrismaClient(
    urlConexion
      ? {
          datasources: {
            db: { url: urlConexion },
          },
        }
      : undefined,
  );
}

export const prisma = globalForPrisma.prisma ?? crearPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
