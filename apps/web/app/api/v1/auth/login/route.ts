import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  atributosCookieSesion,
  firmarSesion,
} from "@/lib/auth";
import { normalizarEmail } from "@/lib/email";
import {
  ErrorNegocio,
  jsonError,
  jsonSiHayExtras,
  jsonValidacion,
} from "@/lib/errores";
import {
  ipDesdeRequest,
  limpiarLoginFallidos,
  loginBloqueado,
  registrarLoginFallido,
} from "@/lib/login-rate-limit";

const HASH_CEBO =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function POST(request: Request) {
  let cuerpo: { email?: string; password?: string };

  try {
    cuerpo = (await request.json()) as {
      email?: string;
      password?: string;
    };
  } catch {
    return jsonValidacion("email must be an email");
  }

  const extras = jsonSiHayExtras(cuerpo, ["email", "password"]);
  if (extras) {
    return extras;
  }

  const email = normalizarEmail(String(cuerpo.email ?? ""));
  const password = cuerpo.password ?? "";

  if (!email) {
    return jsonValidacion("email must be an email");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonValidacion("email must be an email");
  }

  if (typeof cuerpo.password !== "string") {
    return jsonValidacion("password must be a string");
  }

  if (!password) {
    return jsonValidacion("password should not be empty");
  }

  const ip = ipDesdeRequest(request);
  if (await loginBloqueado(ip, email)) {
    return jsonError(new ErrorNegocio("Too Many Requests", 429));
  }

  try {
    const usuario = await prisma.usuario.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
      include: {
        areaOperativa: {
          select: {
            id: true,
            externalAreaId: true,
            nombre: true,
          },
        },
      },
    });

    const valida = await bcrypt.compare(
      password,
      usuario?.passwordHash ?? HASH_CEBO,
    );

    if (!usuario || !valida || !usuario.activo) {
      await registrarLoginFallido(ip, email);
      return jsonError(new ErrorNegocio("Credenciales inválidas", 401));
    }

    await limpiarLoginFallidos(ip, email);

    const token = await firmarSesion({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      tokenVersion: usuario.tokenVersion,
    });

    const respuesta = NextResponse.json({
      token,
      accessToken: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        areaOperativaId: usuario.areaOperativaId,
        areaOperativa: usuario.areaOperativa,
      },
    });

    respuesta.cookies.set(atributosCookieSesion(token, 60 * 60 * 8));

    return respuesta;
  } catch (error) {
    return jsonError(error);
  }
}
