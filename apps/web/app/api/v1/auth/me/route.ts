import { NextResponse } from "next/server";
import { prisma } from "@supervision/database";
import { resolverAuth } from "@/lib/sesion";
import { ErrorNegocio, jsonError } from "@/lib/errores";

export async function GET() {
  const auth = await resolverAuth();

  if ("error" in auth) {
    return jsonError(new ErrorNegocio(auth.error, auth.status));
  }

  const sesion = auth.sesion;

  try {
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
        areaOperativa: {
          select: {
            id: true,
            externalAreaId: true,
            nombre: true,
          },
        },
      },
    });

    if (!usuario) {
      return jsonError(new ErrorNegocio("Usuario no encontrado", 401));
    }

    if (!usuario.activo) {
      return jsonError(new ErrorNegocio("Usuario inactivo", 401));
    }

    return NextResponse.json(usuario);
  } catch (error) {
    return jsonError(error);
  }
}
