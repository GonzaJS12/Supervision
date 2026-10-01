import { NextRequest, NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { obtenerTerritorio } from "@/lib/server/catalogo";

export async function GET(request: NextRequest) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const areaOperativaId = Number(
    request.nextUrl.searchParams.get("areaOperativaId"),
  );

  if (!areaOperativaId) {
    return NextResponse.json(
      { error: "Debe indicar un área operativa" },
      { status: 400 },
    );
  }

  try {
    const territorio = await obtenerTerritorio(sesion, areaOperativaId);
    return NextResponse.json(territorio);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
