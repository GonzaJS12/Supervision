import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { jsonError } from "@/lib/errores";
import { obtenerCatalogoFormulario } from "@/lib/server/catalogo";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  try {
    const catalogo = await obtenerCatalogoFormulario(sesion);
    return NextResponse.json(catalogo);
  } catch (error) {
    return jsonError(error);
  }
}
