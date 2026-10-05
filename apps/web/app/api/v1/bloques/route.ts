import { NextResponse } from "next/server";
import { requerirAdmin, requerirSesion } from "@/lib/requerir";
import { jsonError, jsonValidacion, jsonSiHayExtras } from "@/lib/errores";
import { crearBloque, listarBloques } from "@/lib/server/evaluacion";

export async function GET() {
  const sesion = await requerirSesion();
  if (sesion instanceof NextResponse) {
    return sesion;
  }

  try {
    return NextResponse.json(await listarBloques());
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
    descripcion?: string;
    orden?: number;
  };

  try {
    cuerpo = (await request.json()) as typeof cuerpo;
  } catch {
    return jsonValidacion("nombre should not be empty");
  }

  const extras = jsonSiHayExtras(cuerpo, ["nombre", "descripcion", "orden"]);
  if (extras) {
    return extras;
  }

  if (typeof cuerpo.nombre !== "string") {
    return jsonValidacion("nombre must be a string");
  }

  if (cuerpo.nombre.length === 0) {
    return jsonValidacion("nombre should not be empty");
  }

  if (typeof cuerpo.orden !== "number" || !Number.isInteger(cuerpo.orden)) {
    return jsonValidacion("orden must be an integer number");
  }

  if (cuerpo.orden < 1) {
    return jsonValidacion("orden must not be less than 1");
  }

  if (cuerpo.descripcion !== undefined && typeof cuerpo.descripcion !== "string") {
    return jsonValidacion("descripcion must be a string");
  }

  try {
    const bloque = await crearBloque({
      nombre: cuerpo.nombre,
      descripcion: cuerpo.descripcion,
      orden: Number(cuerpo.orden),
    });
    return NextResponse.json(bloque, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
