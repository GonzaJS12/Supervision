import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { jsonError } from "@/lib/errores";
import { obtenerMetricas } from "@/lib/server/supervisiones";

export async function GET() {
  const sesion = await requerirAdmin();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  try {
    const metricas = await obtenerMetricas(sesion);
    return NextResponse.json(metricas);
  } catch (error) {
    return jsonError(error);
  }
}
