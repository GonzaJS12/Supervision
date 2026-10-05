import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { parseIdParam, jsonError, jsonValidacion, jsonSiHayExtras, enteroDesdeDto } from "@/lib/errores";
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
    const usuario = await buscarUsuario(parseIdParam(id));
    return NextResponse.json(usuario);
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
    apellido?: string;
    email?: string;
    areaOperativaId?: number | null;
  };

  try {
    cuerpo = (await request.json()) as typeof cuerpo;
  } catch {
    return jsonValidacion("nombre must be a string");
  }

  const extras = jsonSiHayExtras(cuerpo, [
    "nombre",
    "apellido",
    "email",
    "areaOperativaId",
  ]);
  if (extras) {
    return extras;
  }

  if (cuerpo.areaOperativaId !== undefined && cuerpo.areaOperativaId !== null) {
    cuerpo.areaOperativaId = enteroDesdeDto(cuerpo.areaOperativaId) as number;
  }

  if (typeof cuerpo.nombre !== "string") {
    return jsonValidacion("nombre must be a string");
  }

  if (cuerpo.nombre.length < 1) {
    return jsonValidacion(
      "nombre must be longer than or equal to 1 characters",
    );
  }

  if (typeof cuerpo.apellido !== "string") {
    return jsonValidacion("apellido must be a string");
  }

  if (cuerpo.apellido.length < 1) {
    return jsonValidacion(
      "apellido must be longer than or equal to 1 characters",
    );
  }

  if (
    typeof cuerpo.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cuerpo.email)
  ) {
    return jsonValidacion("email must be an email");
  }

  if (
    cuerpo.areaOperativaId !== undefined &&
    cuerpo.areaOperativaId !== null
  ) {
    if (!Number.isInteger(cuerpo.areaOperativaId)) {
      return jsonValidacion("areaOperativaId must be an integer number");
    }

    if (cuerpo.areaOperativaId < 1) {
      return jsonValidacion("areaOperativaId must not be less than 1");
    }
  }

  try {
    const usuario = await modificarUsuario(parseIdParam(id), {
      nombre: cuerpo.nombre,
      apellido: cuerpo.apellido,
      email: cuerpo.email,
      areaOperativaId: cuerpo.areaOperativaId,
    });
    return NextResponse.json(usuario);
  } catch (error) {
    return jsonError(error);
  }
}
