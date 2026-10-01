import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { buscarSupervision } from "@/lib/server/supervisiones";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const { id } = await context.params;

  try {
    const supervision = await buscarSupervision(sesion, Number(id));
    return NextResponse.json(supervision);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
