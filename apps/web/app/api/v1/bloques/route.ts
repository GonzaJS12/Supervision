import { NextResponse } from "next/server";
import { requerirAdmin, requerirSesion } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { crearBloque, listarBloques } from "@/lib/server/evaluacion";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  return NextResponse.json(await listarBloques());
}

export async function POST(request: Request) {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const cuerpo = (await request.json()) as {
    nombre?: string;
    descripcion?: string;
    orden?: number;
  };

  if (!cuerpo.nombre || cuerpo.orden == null) {
    return NextResponse.json(
      { error: "Nombre y orden son obligatorios" },
      { status: 400 },
    );
  }

  try {
    const bloque = await crearBloque({
      nombre: cuerpo.nombre,
      descripcion: cuerpo.descripcion,
      orden: Number(cuerpo.orden),
    });
    return NextResponse.json(bloque, { status: 201 });
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
