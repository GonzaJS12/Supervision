import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { buscarUsuario, modificarUsuario } from "@/lib/server/usuarios";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const { id } = await context.params;

  try {
    const usuario = await buscarUsuario(Number(id));
    return NextResponse.json(usuario);
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
    nombre?: string;
    apellido?: string;
    email?: string;
    areaOperativaId?: number | null;
  };

  if (!cuerpo.nombre || !cuerpo.apellido || !cuerpo.email) {
    return NextResponse.json(
      { error: "Faltan datos obligatorios" },
      { status: 400 },
    );
  }

  try {
    const usuario = await modificarUsuario(Number(id), {
      nombre: cuerpo.nombre,
      apellido: cuerpo.apellido,
      email: cuerpo.email,
      areaOperativaId: cuerpo.areaOperativaId,
    });
    return NextResponse.json(usuario);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
