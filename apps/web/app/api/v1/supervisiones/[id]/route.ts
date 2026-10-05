import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { parseIdParam, jsonError } from "@/lib/errores";
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
    const supervision = await buscarSupervision(sesion, parseIdParam(id));
    return NextResponse.json(supervision);
  } catch (error) {
    return jsonError(error);
  }
}
