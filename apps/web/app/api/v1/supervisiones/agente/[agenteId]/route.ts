import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { listarSupervisionesPorAgente } from "@/lib/server/supervisiones";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agenteId: string }> },
) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const { agenteId } = await context.params;

  try {
    const data = await listarSupervisionesPorAgente(
      sesion,
      Number(agenteId),
    );
    return NextResponse.json(data);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
