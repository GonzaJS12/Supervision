import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { parseIdParam, jsonError, jsonValidacion, jsonSiHayExtras, enteroDesdeDto } from "@/lib/errores";
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
  let cuerpo: { areaOperativaId?: number };

  try {
    cuerpo = (await request.json()) as { areaOperativaId?: number };
  } catch {
    return jsonValidacion("areaOperativaId must be an integer number");
  }

  const extras = jsonSiHayExtras(cuerpo, ["areaOperativaId"]);
  if (extras) {
    return extras;
  }

  const areaOperativaId = Number(enteroDesdeDto(cuerpo.areaOperativaId));

  if (!Number.isInteger(areaOperativaId)) {
    return jsonValidacion("areaOperativaId must be an integer number");
  }

  if (areaOperativaId < 1) {
    return jsonValidacion("areaOperativaId must not be less than 1");
  }

  try {
    const usuario = await cambiarAreaOperativa(
      parseIdParam(id),
      areaOperativaId,
    );
    return NextResponse.json(usuario);
  } catch (error) {
    return jsonError(error);
  }
}
