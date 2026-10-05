import { NextResponse } from "next/server";
import { requerirAdmin, requerirSesion } from "@/lib/requerir";
import { parseIdParam, jsonError, jsonValidacion, jsonSiHayExtras } from "@/lib/errores";
import {
  actualizarCriterio,
  buscarCriterio,
} from "@/lib/server/evaluacion";

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
    const criterio = await buscarCriterio(parseIdParam(id));
    return NextResponse.json(criterio);
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
    bloqueId?: number;
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
    "bloqueId",
    "nombre",
    "descripcion",
    "orden",
    "activo",
  ]);
  if (extras) {
    return extras;
  }

  if (cuerpo.bloqueId !== undefined) {
    if (!Number.isInteger(cuerpo.bloqueId)) {
      return jsonValidacion("bloqueId must be an integer number");
    }

    if (cuerpo.bloqueId < 1) {
      return jsonValidacion("bloqueId must not be less than 1");
    }
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
    const criterio = await actualizarCriterio(parseIdParam(id), cuerpo);
    return NextResponse.json(criterio);
  } catch (error) {
    return jsonError(error);
  }
}
