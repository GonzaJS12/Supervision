import { NextResponse } from "next/server";
import { requerirSupervisor } from "@/lib/requerir";
import { jsonError, jsonValidacion } from "@/lib/errores";
import { empujarPendientes, type PendienteSync } from "@/lib/server/sync";

export async function POST(request: Request) {
  const sesion = await requerirSupervisor();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  let cuerpo: {
    pendientes?: PendienteSync[];
  };

  try {
    cuerpo = (await request.json()) as typeof cuerpo;
  } catch {
    return jsonValidacion("No hay supervisiones pendientes");
  }

  if (!Array.isArray(cuerpo.pendientes) || cuerpo.pendientes.length === 0) {
    return jsonValidacion("No hay supervisiones pendientes");
  }

  try {
    const resultados = await empujarPendientes(sesion, cuerpo.pendientes);
    return NextResponse.json({ resultados });
  } catch (error) {
    return jsonError(error);
  }
}
