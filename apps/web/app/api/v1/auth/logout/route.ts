import { NextResponse } from "next/server";
import { COOKIE_SESION } from "@/lib/auth";

export function POST() {
  const respuesta = NextResponse.json({ ok: true });

  respuesta.cookies.set({
    name: COOKIE_SESION,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return respuesta;
}

export const GET = POST;
