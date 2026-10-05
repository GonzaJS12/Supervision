import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { parseIdParam, jsonError } from "@/lib/errores";
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

  try {
    const criterios = await listarCriteriosPorBloque(
      parseIdParam(bloqueId),
    );
    return NextResponse.json(criterios);
  } catch (error) {
    return jsonError(error);
  }
}
