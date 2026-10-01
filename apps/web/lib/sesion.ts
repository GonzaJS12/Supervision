import { cookies, headers } from "next/headers";
import { COOKIE_SESION, leerSesion } from "./auth";

export async function obtenerSesion() {
  const cabeceras = await headers();
  const authorization = cabeceras.get("authorization");

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim();
    const sesion = token ? await leerSesion(token) : null;

    if (sesion) {
      return sesion;
    }
  }

  const jar = await cookies();
  const token = jar.get(COOKIE_SESION)?.value;

  if (!token) {
    return null;
  }

  return leerSesion(token);
}
