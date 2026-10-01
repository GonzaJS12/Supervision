import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { cambiarEstadoUsuario } from "@/lib/server/usuarios";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const { id } = await context.params;
  const cuerpo = (await request.json()) as { activo?: boolean };

  if (typeof cuerpo.activo !== "boolean") {
    return NextResponse.json(
      { error: "Debe indicar activo" },
      { status: 400 },
    );
  }

  try {
    const usuario = await cambiarEstadoUsuario(
      Number(id),
      cuerpo.activo,
      admin.id,
    );
    return NextResponse.json(usuario);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado",
      },
      { status: 400 },
    );
  }
}
