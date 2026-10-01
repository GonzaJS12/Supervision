import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { cambiarAreaOperativa } from "@/lib/server/usuarios";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const { id } = await context.params;
  const cuerpo = (await request.json()) as { areaOperativaId?: number };

  if (!cuerpo.areaOperativaId) {
    return NextResponse.json(
      { error: "Debe indicar un área operativa" },
      { status: 400 },
    );
  }

  try {
    const usuario = await cambiarAreaOperativa(
      Number(id),
      Number(cuerpo.areaOperativaId),
    );
    return NextResponse.json(usuario);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
