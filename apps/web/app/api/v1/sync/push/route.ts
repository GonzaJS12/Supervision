import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { empujarPendientes, type PendienteSync } from "@/lib/server/sync";

export async function POST(request: Request) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const cuerpo = (await request.json()) as {
    pendientes?: PendienteSync[];
  };

  if (!Array.isArray(cuerpo.pendientes) || cuerpo.pendientes.length === 0) {
    return NextResponse.json(
      { error: "No hay supervisiones pendientes" },
      { status: 400 },
    );
  }

  try {
    const resultados = await empujarPendientes(sesion, cuerpo.pendientes);
    return NextResponse.json({ resultados });
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
