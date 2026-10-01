import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESION = "supervision_token";

export type SesionUsuario = {
  id: number;
  email: string;
  rol: "ADMIN" | "SUPERVISOR";
  nombre: string;
  apellido: string;
  areaOperativaId: number | null;
};

function secreto() {
  const valor = process.env.JWT_SECRET?.trim();

  if (!valor) {
    throw new Error("JWT_SECRET no está configurado");
  }

  return new TextEncoder().encode(valor);
}

export async function firmarSesion(
  usuario: SesionUsuario,
) {
  return new SignJWT({
    sub: String(usuario.id),
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    areaOperativaId: usuario.areaOperativaId,
  })
    .setProtectedHeader({ alg: "HS256" })
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
    const nombre = String(payload.nombre ?? "");
    const apellido = String(payload.apellido ?? "");
    const areaOperativaId =
      payload.areaOperativaId == null
        ? null
        : Number(payload.areaOperativaId);

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
      nombre,
      apellido,
      areaOperativaId:
        Number.isInteger(areaOperativaId)
          ? areaOperativaId
          : null,
    };
  } catch {
    return null;
  }
}
