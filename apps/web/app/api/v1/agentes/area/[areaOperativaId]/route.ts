import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { parseIdParam, jsonError } from "@/lib/errores";
import { listarAgentesPorArea } from "@/lib/server/agentes";

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
    const agentes = await listarAgentesPorArea(
      sesion,
      parseIdParam(areaOperativaId),
    );
    return NextResponse.json(agentes);
  } catch (error) {
    return jsonError(error);
  }
}
