import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { listarCriteriosPorBloque } from "@/lib/server/evaluacion";

export async function GET(
  _request: Request,
  context: { params: Promise<{ bloqueId: string }> },
) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const { bloqueId } = await context.params;
  const criterios = await listarCriteriosPorBloque(Number(bloqueId));
  return NextResponse.json(criterios);
}
