import { NextResponse } from "next/server";
import { resolverAuth } from "@/lib/sesion";
import type { SesionUsuario } from "@/lib/auth";
import { ErrorNegocio, jsonError } from "@/lib/errores";

export async function requerirSesion(): Promise<
  SesionUsuario | NextResponse
> {
  const resultado = await resolverAuth();

  if ("error" in resultado) {
    return jsonError(new ErrorNegocio(resultado.error, resultado.status));
  }

  return resultado.sesion;
}

export async function requerirAdmin(): Promise<
  SesionUsuario | NextResponse
> {
  const sesion = await requerirSesion();

  if (sesion instanceof NextResponse) {
    return sesion;
  }

  if (sesion.rol !== "ADMIN") {
    return jsonError(
      new ErrorNegocio(
        "No tiene permiso para realizar esta operacion",
        403,
      ),
    );
  }

  return sesion;
}

export async function requerirSupervisor(): Promise<
  SesionUsuario | NextResponse
> {
  const sesion = await requerirSesion();

  if (sesion instanceof NextResponse) {
    return sesion;
  }

  if (sesion.rol !== "SUPERVISOR") {
    return jsonError(
      new ErrorNegocio(
        "No tiene permiso para realizar esta operacion",
        403,
      ),
    );
  }

  return sesion;
}
