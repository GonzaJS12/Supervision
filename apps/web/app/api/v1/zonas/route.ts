import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { listarZonasActivas } from "@/lib/server/catalogo";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  return NextResponse.json(await listarZonasActivas());
}
