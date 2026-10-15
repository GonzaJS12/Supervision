import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const COOKIE_SESION = "supervision_token";
export const JWT_ISS = "supervision-aps";
export const JWT_AUD = "supervision-aps";

export type SesionUsuario = {
  id: number;
  email: string;
  rol: "ADMIN" | "SUPERVISOR";
  nombre: string;
  apellido: string;
  areaOperativaId: number | null;
  areaOperativaNombre?: string | null;
  tokenVersion: number;
};

function secreto() {
  const valor = process.env.JWT_SECRET?.trim();

  if (!valor) {
    throw new Error("JWT_SECRET no está configurado");
  }

  return new TextEncoder().encode(valor);
}

export function cookieEnProduccion() {
  return process.env.NODE_ENV === "production";
}

export function atributosCookieSesion(token: string, maxAge: number) {
  return {
    name: COOKIE_SESION,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieEnProduccion(),
    path: "/",
    maxAge,
  };
}

export async function firmarSesion(usuario: {
  id: number;
  email: string;
  rol: SesionUsuario["rol"];
  tokenVersion: number;
}) {
  return new SignJWT({
    email: usuario.email,
    rol: usuario.rol,
    ver: usuario.tokenVersion,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(usuario.id))
    .setIssuer(JWT_ISS)
    .setAudience(JWT_AUD)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secreto());
}

export async function leerSesion(
  token: string,
): Promise<SesionUsuario | null> {
  try {
    const { payload } = await jwtVerify(token, secreto(), {
      issuer: JWT_ISS,
      audience: JWT_AUD,
      algorithms: ["HS256"],
    });

    const id = Number(payload.sub);
    const email = String(payload.email ?? "");
    const rol = payload.rol as SesionUsuario["rol"];
    const tokenVersion = Number(payload.ver ?? 0);

    if (
      !id ||
      !email ||
      (rol !== "ADMIN" && rol !== "SUPERVISOR") ||
      !Number.isInteger(tokenVersion) ||
      tokenVersion < 0
    ) {
      return null;
    }

    return {
      id,
      email,
      rol,
      nombre: "",
      apellido: "",
      areaOperativaId: null,
      tokenVersion,
    };
  } catch {
    return null;
  }
}
