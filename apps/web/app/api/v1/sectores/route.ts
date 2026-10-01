import { NextRequest, NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { listarSectoresParaUsuario } from "@/lib/server/catalogo";

export async function GET(request: NextRequest) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const areaOperativaId = request.nextUrl.searchParams.get("areaOperativaId");

  try {
    const sectores = await listarSectoresParaUsuario(
      sesion,
      areaOperativaId ? Number(areaOperativaId) : undefined,
    );
    return NextResponse.json(sectores);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
