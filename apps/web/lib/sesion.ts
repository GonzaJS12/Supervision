import { cookies, headers } from "next/headers";
import { prisma } from "@supervision/database";
import { COOKIE_SESION, leerSesion, type SesionUsuario } from "./auth";

export type ResultadoAuth =
  | { sesion: SesionUsuario }
  | { error: string; status: 401 };

export async function resolverAuth(): Promise<ResultadoAuth> {
  const cabeceras = await headers();
  const authorization = cabeceras.get("authorization");

  let token: string | undefined;

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    token = authorization.slice(7).trim();
  }

  if (!token) {
    const jar = await cookies();
    token = jar.get(COOKIE_SESION)?.value;
  }

  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }

  const sesion = await leerSesion(token);

  if (!sesion) {
    return { error: "Unauthorized", status: 401 };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.id },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      activo: true,
      areaOperativaId: true,
      areaOperativa: { select: { nombre: true } },
    },
  });

  if (!usuario) {
    return { error: "Usuario no encontrado", status: 401 };
  }

  if (!usuario.activo) {
    return { error: "Usuario inactivo", status: 401 };
  }

  return {
    sesion: {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      areaOperativaId: usuario.areaOperativaId,
      areaOperativaNombre: usuario.areaOperativa?.nombre ?? null,
    },
  };
}

export async function obtenerSesion(): Promise<SesionUsuario | null> {
  const resultado = await resolverAuth();
  return "sesion" in resultado ? resultado.sesion : null;
}
