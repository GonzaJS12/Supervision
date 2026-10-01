import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { listarBloquesActivos } from "@/lib/server/catalogo";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  return NextResponse.json(await listarBloquesActivos());
}
