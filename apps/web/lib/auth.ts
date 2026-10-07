import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const COOKIE_SESION = "supervision_token";

export type SesionUsuario = {
  id: number;
  email: string;
  rol: "ADMIN" | "SUPERVISOR";
  nombre: string;
  apellido: string;
  areaOperativaId: number | null;
  areaOperativaNombre?: string | null;
};

function secreto() {
  const valor = process.env.JWT_SECRET?.trim();

  if (!valor) {
    throw new Error("JWT_SECRET no está configurado");
  }

  return new TextEncoder().encode(valor);
}

export async function firmarSesion(usuario: {
  id: number;
  email: string;
  rol: SesionUsuario["rol"];
}) {
  return new SignJWT({
    email: usuario.email,
    rol: usuario.rol,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(usuario.id))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secreto());
}

export async function leerSesion(
  token: string,
): Promise<SesionUsuario | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      secreto(),
    );

    const id = Number(payload.sub);
    const email = String(payload.email ?? "");
    const rol = payload.rol as SesionUsuario["rol"];

    if (
      !id ||
      !email ||
      (rol !== "ADMIN" && rol !== "SUPERVISOR")
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
    };
  } catch {
    return null;
  }
}
