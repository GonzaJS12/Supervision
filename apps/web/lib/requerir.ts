import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/sesion";
import type { SesionUsuario } from "@/lib/auth";

export async function requerirSesion(): Promise<
  SesionUsuario | NextResponse
> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 },
    );
  }

  return sesion;
}

export async function requerirAdmin(): Promise<
  SesionUsuario | NextResponse
> {
  const sesion = await requerirSesion();

  if (sesion instanceof NextResponse) {
    return sesion;
  }

  if (sesion.rol !== "ADMIN") {
    return NextResponse.json(
      { error: "No tiene permiso para esta operación" },
      { status: 403 },
    );
  }

  return sesion;
}
