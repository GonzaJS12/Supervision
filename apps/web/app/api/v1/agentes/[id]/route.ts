import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { parseIdParam, jsonError } from "@/lib/errores";
import { buscarAgente } from "@/lib/server/agentes";

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
    const agente = await buscarAgente(sesion, parseIdParam(id));
    return NextResponse.json(agente);
  } catch (error) {
    return jsonError(error);
  }
}
