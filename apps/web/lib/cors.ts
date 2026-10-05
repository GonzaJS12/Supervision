import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const METODOS = "GET,POST,PATCH,OPTIONS";
const CABECERAS = "Content-Type, Authorization";

function esLanPrivada(hostname: string) {
  return (
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function origenesPermitidos() {
  return (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean);
}

function origenPermitido(origin: string | null) {
  if (!origin || origin === "null") {
    return null;
  }

  const lista = origenesPermitidos();
  if (lista.includes(origin)) {
    return origin;
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      const url = new URL(origin);
      if (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "10.0.2.2" ||
        esLanPrivada(url.hostname)
      ) {
        return origin;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function cabecerasCors(request: NextRequest) {
  const origin = request.headers.get("origin");
  const bearer = request.headers
    .get("authorization")
    ?.toLowerCase()
    .startsWith("bearer ");

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": CABECERAS,
    "Access-Control-Allow-Methods": METODOS,
  };

  if (bearer) {
    headers["Access-Control-Allow-Origin"] =
      origin && origin !== "null" ? origin : "*";
    if (origin && origin !== "null") {
      headers.Vary = "Origin";
    }
    return headers;
  }

  const permitido = origenPermitido(origin);
  if (permitido) {
    headers["Access-Control-Allow-Origin"] = permitido;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers.Vary = "Origin";
  }

  return headers;
}

export function respuestaCors(request: NextRequest, status = 204) {
  return new NextResponse(null, {
    status,
    headers: cabecerasCors(request),
  });
}

export function aplicarCors(request: NextRequest, respuesta: NextResponse) {
  Object.entries(cabecerasCors(request)).forEach(([clave, valor]) => {
    respuesta.headers.set(clave, valor);
  });
  return respuesta;
}
