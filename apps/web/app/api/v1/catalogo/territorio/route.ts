import { NextRequest, NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { parseIdParam, jsonError, jsonValidacion } from "@/lib/errores";
import { obtenerTerritorio } from "@/lib/server/catalogo";

export async function GET(request: NextRequest) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const bruto = request.nextUrl.searchParams.get("areaOperativaId");

  if (!bruto || !/^\d+$/.test(bruto)) {
    return jsonValidacion("areaOperativaId must be an integer number");
  }

  try {
    const territorio = await obtenerTerritorio(sesion, parseIdParam(bruto));
    return NextResponse.json(territorio);
  } catch (error) {
    return jsonError(error);
  }
}
