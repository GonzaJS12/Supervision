import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { obtenerCatalogoFormulario } from "@/lib/server/catalogo";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const catalogo = await obtenerCatalogoFormulario(sesion);
  return NextResponse.json(catalogo);
}
