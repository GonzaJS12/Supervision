import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_SESION, leerSesion } from "@/lib/auth";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
};

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: cors });
    }

    const respuesta = NextResponse.next();
    Object.entries(cors).forEach(([clave, valor]) => {
      respuesta.headers.set(clave, valor);
    });
    return respuesta;
  }

  const token = request.cookies.get(COOKIE_SESION)?.value;
  const loginUrl = new URL("/login", request.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const sesion = await leerSesion(token);

  if (!sesion) {
    const respuesta = NextResponse.redirect(loginUrl);
    respuesta.cookies.delete(COOKIE_SESION);
    return respuesta;
  }

  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    sesion.rol !== "ADMIN"
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
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
