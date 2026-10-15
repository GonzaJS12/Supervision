import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { parseIdParam, jsonError, jsonValidacion, jsonSiHayExtras } from "@/lib/errores";
import { mensajePasswordInvalida } from "@supervision/domain";
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
  let cuerpo: { password?: string };

  try {
    cuerpo = (await request.json()) as { password?: string };
  } catch {
    return jsonValidacion(
      "password must be longer than or equal to 10 characters",
    );
  }

  const extras = jsonSiHayExtras(cuerpo, ["password"]);
  if (extras) {
    return extras;
  }

  if (typeof cuerpo.password !== "string") {
    return jsonValidacion("password must be a string");
  }

  const passwordInvalida = mensajePasswordInvalida(cuerpo.password);
  if (passwordInvalida) {
    return jsonValidacion(passwordInvalida);
  }

  try {
    const usuario = await cambiarPasswordUsuario(
      parseIdParam(id),
      cuerpo.password ?? "",
    );
    return NextResponse.json(usuario);
  } catch (error) {
    return jsonError(error);
  }
}
