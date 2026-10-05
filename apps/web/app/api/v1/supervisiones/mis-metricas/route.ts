import { NextResponse } from "next/server";
import { requerirSupervisor } from "@/lib/requerir";
import { cuerpoErrorHttp } from "@/lib/errores";
import { obtenerMetricas } from "@/lib/server/supervisiones";

export async function GET() {
  const sesion = await requerirSupervisor();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  try {
    const metricas = await obtenerMetricas(sesion);
    return NextResponse.json(metricas);
  } catch (error) {
    const { status, body } = cuerpoErrorHttp(error);
    return NextResponse.json(body, { status });
  }
}
