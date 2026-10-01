import { NextRequest, NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron listar los agentes",
      },
      { status: 403 },
    );
  }
}
