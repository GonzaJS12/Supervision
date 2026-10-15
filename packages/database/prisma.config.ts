import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

const raiz = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

config({ path: path.join(raiz, ".env") });
config({ path: path.join(raiz, "apps/web/.env"), override: true });

const placeholder =
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

const databaseUrl =
  process.env.DATABASE_URL?.trim() || placeholder;

function hostDe(url) {
  try {
    return new URL(url.replace(/^postgres(?:ql)?:/, "https:")).hostname;
  } catch {
    return "";
  }
}

const directDesdeEnv = process.env.DIRECT_URL?.trim();
const hostDb = hostDe(databaseUrl);
const usarDirectoLocal =
  hostDb === "localhost" || hostDb === "127.0.0.1";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
    directUrl: usarDirectoLocal
      ? databaseUrl
      : directDesdeEnv || databaseUrl,
  },
});
