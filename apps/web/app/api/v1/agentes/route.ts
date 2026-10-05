import { NextRequest, NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { jsonError } from "@/lib/errores";
import { listarAgentes } from "@/lib/server/agentes";

export async function GET(request: NextRequest) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const params = request.nextUrl.searchParams;

  try {
    const resultado = await listarAgentes({
      sesion,
      page: Number(params.get("page") ?? 1),
      limit: params.get("limit")
        ? Number(params.get("limit"))
        : undefined,
      nombre: params.get("nombre") ?? undefined,
      areaOperativaId: params.get("areaOperativaId")
        ? Number(params.get("areaOperativaId"))
        : undefined,
      sectorId: params.get("sectorId")
        ? Number(params.get("sectorId"))
        : undefined,
    });

    return NextResponse.json(resultado);
  } catch (error) {
    return jsonError(error);
  }
}
