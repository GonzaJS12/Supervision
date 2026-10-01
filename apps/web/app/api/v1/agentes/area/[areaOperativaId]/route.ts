import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { obtenerTerritorio } from "@/lib/server/catalogo";

export async function GET(
  _request: Request,
  context: { params: Promise<{ areaOperativaId: string }> },
) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const { areaOperativaId } = await context.params;

  try {
    const { agentes } = await obtenerTerritorio(
      sesion,
      Number(areaOperativaId),
    );
    return NextResponse.json(agentes);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
