import { NextResponse } from "next/server";
import { prisma } from "@supervision/database";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      servicio: "supervision-aps",
      db: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        servicio: "supervision-aps",
        db: "disconnected",
      },
      { status: 503 },
    );
  }
}
