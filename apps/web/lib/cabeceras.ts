import { NextResponse } from "next/server";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function aplicarCabecerasSeguridad(respuesta: NextResponse) {
  respuesta.headers.set("X-Content-Type-Options", "nosniff");
  respuesta.headers.set("X-Frame-Options", "DENY");
  respuesta.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  respuesta.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  respuesta.headers.set("X-DNS-Prefetch-Control", "off");
  respuesta.headers.set("Content-Security-Policy", CSP);
  return respuesta;
}
