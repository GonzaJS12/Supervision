import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { listarSectoresParaUsuario } from "@/lib/server/catalogo";

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
    const sectores = await listarSectoresParaUsuario(
      sesion,
      Number(areaOperativaId),
    );
    return NextResponse.json(sectores);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
