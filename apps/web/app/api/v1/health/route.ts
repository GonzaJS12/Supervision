import { NextResponse } from "next/server";
import { prisma, resumenDatabaseUrl } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const resumen = resumenDatabaseUrl();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      servicio: "supervision-aps",
      db: "connected",
      ...resumen,
    });
  } catch (error) {
    const codigo =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : undefined;
    const crudo =
      error instanceof Error ? error.message : "error de conexion";
    const detalle = crudo.replace(/postgresql:\/\/\S+/gi, "[redacted]");

    return NextResponse.json(
      {
        status: "error",
        servicio: "supervision-aps",
        db: "disconnected",
        ...resumen,
        codigo,
        detalle,
      },
      { status: 503 },
    );
  }
}
