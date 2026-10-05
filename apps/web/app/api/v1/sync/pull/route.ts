import { NextResponse } from "next/server";
import { requerirSupervisor } from "@/lib/requerir";
import { jsonError } from "@/lib/errores";
import { obtenerPaqueteSync } from "@/lib/server/sync";

export async function GET() {
  const sesion = await requerirSupervisor();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  try {
    const paquete = await obtenerPaqueteSync(sesion);
    return NextResponse.json(paquete);
  } catch (error) {
    return jsonError(error);
  }
}
