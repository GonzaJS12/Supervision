import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { jsonError } from "@/lib/errores";
import { listarAreasParaUsuario } from "@/lib/server/catalogo";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  try {
    return NextResponse.json(await listarAreasParaUsuario(sesion));
  } catch (error) {
    return jsonError(error);
  }
}
