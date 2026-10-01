import { NextResponse } from "next/server";
import { requerirAdmin, requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { crearCriterio, listarCriterios } from "@/lib/server/evaluacion";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  return NextResponse.json(await listarCriterios());
}

export async function POST(request: Request) {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const cuerpo = (await request.json()) as {
    bloqueId?: number;
    nombre?: string;
    descripcion?: string;
    orden?: number;
  };

  if (!cuerpo.bloqueId || !cuerpo.nombre || cuerpo.orden == null) {
    return NextResponse.json(
      { error: "Bloque, nombre y orden son obligatorios" },
      { status: 400 },
    );
  }

  try {
    const criterio = await crearCriterio({
      bloqueId: Number(cuerpo.bloqueId),
      nombre: cuerpo.nombre,
      descripcion: cuerpo.descripcion,
      orden: Number(cuerpo.orden),
    });
    return NextResponse.json(criterio, { status: 201 });
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
