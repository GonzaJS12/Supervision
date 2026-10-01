import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { obtenerMetricas } from "@/lib/server/supervisiones";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const metricas = await obtenerMetricas(sesion);
  return NextResponse.json(metricas);
}
