import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    servicio: "API Supervisión de Agentes Sanitarios",
    status: "ok",
    health: "/health",
  });
}
