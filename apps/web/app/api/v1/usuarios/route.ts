import { NextResponse } from "next/server";
import { requerirAdmin } from "@/lib/requerir";
import { listarUsuarios, crearUsuario } from "@/lib/server/usuarios";

export async function GET() {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const usuarios = await listarUsuarios();
  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
  const admin = await requerirAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const cuerpo = (await request.json()) as {
    nombre?: string;
    apellido?: string;
    email?: string;
    password?: string;
    rol?: "ADMIN" | "SUPERVISOR";
    areaOperativaId?: number | null;
  };

  if (
    !cuerpo.nombre ||
    !cuerpo.apellido ||
    !cuerpo.email ||
    !cuerpo.password ||
    !cuerpo.rol
  ) {
    return NextResponse.json(
      { error: "Faltan datos obligatorios" },
      { status: 400 },
    );
  }

  if (cuerpo.password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 },
    );
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el usuario",
      },
      { status: 400 },
    );
  }
}
