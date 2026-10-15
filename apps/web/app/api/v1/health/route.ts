import { NextResponse } from "next/server";
import { prisma, resumenDatabaseUrl } from "@/lib/prisma";

export const runtime = "nodejs";

function incluirDiagnostico() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.HEALTH_DETALLE === "1"
  );
}

export async function GET() {
  const diagnostico = incluirDiagnostico() ? resumenDatabaseUrl() : {};

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      servicio: "supervision-aps",
      db: "connected",
      ...diagnostico,
    });
  } catch (error) {
    const cuerpo: Record<string, unknown> = {
      status: "error",
      servicio: "supervision-aps",
      db: "disconnected",
      ...diagnostico,
    };

    if (incluirDiagnostico()) {
      cuerpo.codigo =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: unknown }).code)
          : undefined;
      const crudo =
        error instanceof Error ? error.message : "error de conexion";
      cuerpo.detalle = crudo.replace(/postgresql:\/\/\S+/gi, "[redacted]");
    }

    return NextResponse.json(cuerpo, { status: 503 });
  }
}
