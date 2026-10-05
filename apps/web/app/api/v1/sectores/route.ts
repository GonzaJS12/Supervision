import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { jsonError } from "@/lib/errores";
import { listarSectoresParaUsuario } from "@/lib/server/catalogo";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  try {
    const sectores = await listarSectoresParaUsuario(sesion);
    return NextResponse.json(sectores);
  } catch (error) {
    return jsonError(error);
  }
}
