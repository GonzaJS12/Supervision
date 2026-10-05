import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { jsonError, jsonSiHayExtras, jsonValidacion, enteroDesdeDto } from "@/lib/errores";
import { listarUsuarios, crearUsuario } from "@/lib/server/usuarios";

export async function GET() {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  try {
    const usuarios = await listarUsuarios();
    return NextResponse.json(usuarios);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  let cuerpo: {
    nombre?: string;
    apellido?: string;
    email?: string;
    password?: string;
    rol?: "ADMIN" | "SUPERVISOR";
    areaOperativaId?: number | null;
  };

  try {
    cuerpo = (await request.json()) as typeof cuerpo;
  } catch {
    return jsonValidacion("nombre should not be empty");
  }

  const extras = jsonSiHayExtras(cuerpo, [
    "nombre",
    "apellido",
    "email",
    "password",
    "rol",
    "areaOperativaId",
  ]);
  if (extras) {
    return extras;
  }

  cuerpo.areaOperativaId = enteroDesdeDto(cuerpo.areaOperativaId) as
    | number
    | null
    | undefined;

  if (typeof cuerpo.nombre !== "string") {
    return jsonValidacion("nombre must be a string");
  }

  if (cuerpo.nombre.length === 0) {
    return jsonValidacion("nombre should not be empty");
  }

  if (typeof cuerpo.apellido !== "string") {
    return jsonValidacion("apellido must be a string");
  }

  if (cuerpo.apellido.length === 0) {
    return jsonValidacion("apellido should not be empty");
  }

  if (
    !cuerpo.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cuerpo.email)
  ) {
    return jsonValidacion("email must be an email");
  }

  if (typeof cuerpo.password !== "string") {
    return jsonValidacion("password must be a string");
  }

  if (cuerpo.password.length < 8) {
    return jsonValidacion(
      "password must be longer than or equal to 8 characters",
    );
  }

  if (cuerpo.rol !== "ADMIN" && cuerpo.rol !== "SUPERVISOR") {
    return jsonValidacion(
      "rol must be one of the following values: ADMIN, SUPERVISOR",
    );
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
    const usuario = await crearUsuario({
      nombre: cuerpo.nombre,
      apellido: cuerpo.apellido,
      email: cuerpo.email,
      password: cuerpo.password,
      rol: cuerpo.rol,
      areaOperativaId: cuerpo.areaOperativaId,
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
