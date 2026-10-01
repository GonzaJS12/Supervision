import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { listarParaExportacion } from "@/lib/server/supervisiones";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const data = await listarParaExportacion(sesion);
  return NextResponse.json(data);
}
