import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@supervision/database";
import {
  COOKIE_SESION,
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
  if (loginBloqueado(ip, email)) {
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

    if (!usuario) {
      registrarLoginFallido(ip, email);
      return jsonError(new ErrorNegocio("Credenciales inválidas", 401));
    }

    const valida = await bcrypt.compare(password, usuario.passwordHash);

    if (!valida) {
      registrarLoginFallido(ip, email);
      return jsonError(new ErrorNegocio("Credenciales inválidas", 401));
    }

    if (!usuario.activo) {
      return jsonError(new ErrorNegocio("Usuario inactivo", 401));
    }

    limpiarLoginFallidos(ip, email);

    const token = await firmarSesion({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
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

    respuesta.cookies.set({
      name: COOKIE_SESION,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return respuesta;
  } catch (error) {
    return jsonError(error);
  }
}
