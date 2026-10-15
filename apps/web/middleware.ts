import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_SESION,
  atributosCookieSesion,
  leerSesion,
} from "@/lib/auth";
import { aplicarCabecerasSeguridad } from "@/lib/cabeceras";
import { aplicarCors, respuestaCors } from "@/lib/cors";

function finalizar(respuesta: NextResponse) {
  return aplicarCabecerasSeguridad(respuesta);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return finalizar(respuestaCors(request));
    }

    return finalizar(aplicarCors(request, NextResponse.next()));
  }

  if (pathname === "/login" || pathname === "/" || pathname === "/health") {
    return finalizar(NextResponse.next());
  }

  const token = request.cookies.get(COOKIE_SESION)?.value;
  const loginUrl = new URL("/login", request.url);

  if (!token) {
    return finalizar(NextResponse.redirect(loginUrl));
  }

  const sesion = await leerSesion(token);

  if (!sesion) {
    const respuesta = NextResponse.redirect(loginUrl);
    respuesta.cookies.set({
      ...atributosCookieSesion("", 0),
      expires: new Date(0),
    });
    return finalizar(respuesta);
  }

  if (pathname.startsWith("/admin") && sesion.rol !== "ADMIN") {
    return finalizar(
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }

  return finalizar(NextResponse.next());
}

export const config = {
  matcher: [
    "/api/:path*",
    "/",
    "/login",
    "/health",
    "/dashboard",
    "/dashboard/:path*",
    "/agentes/:path*",
    "/agentes",
    "/supervisiones/:path*",
    "/supervisiones",
    "/admin/:path*",
    "/admin",
  ],
};
