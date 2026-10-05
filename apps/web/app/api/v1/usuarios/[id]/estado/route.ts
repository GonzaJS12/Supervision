import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { parseIdParam, jsonError, jsonValidacion, jsonSiHayExtras } from "@/lib/errores";
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
  let cuerpo: { activo?: boolean };

  try {
    cuerpo = (await request.json()) as { activo?: boolean };
  } catch {
    return jsonValidacion("activo must be a boolean value");
  }

  const extras = jsonSiHayExtras(cuerpo, ["activo"]);
  if (extras) {
    return extras;
  }

  if (typeof cuerpo.activo !== "boolean") {
    return jsonValidacion("activo must be a boolean value");
  }

  try {
    const usuario = await cambiarEstadoUsuario(
      parseIdParam(id),
      cuerpo.activo,
      admin.id,
    );
    return NextResponse.json(usuario);
  } catch (error) {
    return jsonError(error);
  }
}
