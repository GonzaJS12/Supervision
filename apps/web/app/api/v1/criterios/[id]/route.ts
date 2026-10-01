import { NextResponse } from "next/server";
import { requerirAdmin, requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import {
  actualizarCriterio,
  buscarCriterio,
} from "@/lib/server/evaluacion";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  const { id } = await context.params;

  try {
    const criterio = await buscarCriterio(Number(id));
    return NextResponse.json(criterio);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const { id } = await context.params;
  const cuerpo = (await request.json()) as {
    bloqueId?: number;
    nombre?: string;
    descripcion?: string | null;
    orden?: number;
    activo?: boolean;
  };

  try {
    const criterio = await actualizarCriterio(Number(id), cuerpo);
    return NextResponse.json(criterio);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
