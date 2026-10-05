import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { jsonError } from "@/lib/errores";
import { listarRondasActivas } from "@/lib/server/catalogo";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  try {
    return NextResponse.json(await listarRondasActivas());
  } catch (error) {
    return jsonError(error);
  }
}
