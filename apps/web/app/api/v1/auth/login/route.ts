import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@supervision/database";
import {
  COOKIE_SESION,
  firmarSesion,
} from "@/lib/auth";

export async function POST(request: Request) {
  const cuerpo = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = cuerpo.email?.trim().toLowerCase();
  const password = cuerpo.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son obligatorios" },
      { status: 400 },
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 },
    );
  }

  const valida = await bcrypt.compare(
    password,
    usuario.passwordHash,
  );

  if (!valida) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 },
    );
  }

  if (!usuario.activo) {
    return NextResponse.json(
      { error: "Usuario inactivo" },
      { status: 401 },
    );
  }

  const token = await firmarSesion({
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    areaOperativaId: usuario.areaOperativaId,
  });

  const respuesta = NextResponse.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      areaOperativaId: usuario.areaOperativaId,
    },
  });

  respuesta.cookies.set({
    name: COOKIE_SESION,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return respuesta;
}
