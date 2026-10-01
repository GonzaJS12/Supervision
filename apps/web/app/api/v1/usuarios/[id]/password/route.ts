import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { respuestaError } from "@/lib/errores";
import { cambiarPasswordUsuario } from "@/lib/server/usuarios";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const { id } = await context.params;
  const cuerpo = (await request.json()) as { password?: string };

  try {
    const usuario = await cambiarPasswordUsuario(
      Number(id),
      cuerpo.password ?? "",
    );
    return NextResponse.json(usuario);
  } catch (error) {
    const { status, error: mensaje } = respuestaError(error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
