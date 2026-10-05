import { NextRequest, NextResponse } from "next/server";
import { requerirSupervisor } from "@/lib/requerir";
import { jsonError } from "@/lib/errores";
import { listarSupervisiones } from "@/lib/server/supervisiones";

export async function GET(request: NextRequest) {
  const sesion = await requerirSupervisor();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const params = request.nextUrl.searchParams;

  try {
    const resultado = await listarSupervisiones(sesion, {
      page: Number(params.get("page") ?? 1),
      limit: params.get("limit")
        ? Number(params.get("limit"))
        : undefined,
      fechaDesde: params.get("fechaDesde") ?? undefined,
      fechaHasta: params.get("fechaHasta") ?? undefined,
      clasificacion: params.get("clasificacion") ?? undefined,
    });

    return NextResponse.json(resultado);
  } catch (error) {
    return jsonError(error);
  }
}
