import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { parseIdParam, cuerpoErrorHttp } from "@/lib/errores";
import { listarSectoresPorArea } from "@/lib/server/catalogo";

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
    const sectores = await listarSectoresPorArea(
      sesion,
      parseIdParam(areaOperativaId),
    );
    return NextResponse.json(sectores);
  } catch (error) {
    const { status, body } = cuerpoErrorHttp(error);
    return NextResponse.json(body, { status });
  }
}
