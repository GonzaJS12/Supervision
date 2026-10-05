import { NextResponse } from "next/server";
import { requerirAdmin, requerirSesion } from "@/lib/requerir";
import { parseIdParam, jsonError, jsonValidacion, jsonSiHayExtras } from "@/lib/errores";
import { actualizarBloque, buscarBloque } from "@/lib/server/evaluacion";

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
    const bloque = await buscarBloque(parseIdParam(id));
    return NextResponse.json(bloque);
  } catch (error) {
    return jsonError(error);
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
  let cuerpo: {
    nombre?: string;
    descripcion?: string | null;
    orden?: number;
    activo?: boolean;
  };

  try {
    cuerpo = (await request.json()) as typeof cuerpo;
  } catch {
    return jsonValidacion("nombre must be a string");
  }

  const extras = jsonSiHayExtras(cuerpo, [
    "nombre",
    "descripcion",
    "orden",
    "activo",
  ]);
  if (extras) {
    return extras;
  }

  if (cuerpo.nombre !== undefined && typeof cuerpo.nombre !== "string") {
    return jsonValidacion("nombre must be a string");
  }

  if (cuerpo.descripcion !== undefined && typeof cuerpo.descripcion !== "string") {
    return jsonValidacion("descripcion must be a string");
  }

  if (cuerpo.orden !== undefined) {
    if (!Number.isInteger(cuerpo.orden)) {
      return jsonValidacion("orden must be an integer number");
    }

    if (cuerpo.orden < 1) {
      return jsonValidacion("orden must not be less than 1");
    }
  }

  if (cuerpo.activo !== undefined && typeof cuerpo.activo !== "boolean") {
    return jsonValidacion("activo must be a boolean value");
  }

  try {
    const bloque = await actualizarBloque(parseIdParam(id), cuerpo);
    return NextResponse.json(bloque);
  } catch (error) {
    return jsonError(error);
  }
}
