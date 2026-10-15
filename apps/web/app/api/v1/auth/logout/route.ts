import { NextResponse } from "next/server";
import { atributosCookieSesion } from "@/lib/auth";

export function POST() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set({
    ...atributosCookieSesion("", 0),
    expires: new Date(0),
  });
  return respuesta;
}
