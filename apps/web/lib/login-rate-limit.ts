import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const VENTANA_MS = 15 * 60 * 1000;
const MAX_INTENTOS = 10;
const memoria = new Map<string, { cantidad: number; reset: number }>();

function clave(ip: string, email: string) {
  return `${ip}|${email.trim().toLowerCase()}`.slice(0, 180);
}

function tablaAusente(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

export function ipDesdeRequest(request: Request) {
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) {
    return vercel.split(",")[0]?.trim() || "unknown";
  }

  const reenviada = request.headers.get("x-forwarded-for");
  if (reenviada) {
    return reenviada.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function bloqueadoEnMemoria(id: string) {
  const ahora = Date.now();
  const registro = memoria.get(id);
  if (!registro || ahora > registro.reset) {
    return false;
  }
  return registro.cantidad >= MAX_INTENTOS;
}

function registrarEnMemoria(id: string) {
  const ahora = Date.now();
  const registro = memoria.get(id);
  if (!registro || ahora > registro.reset) {
    memoria.set(id, { cantidad: 1, reset: ahora + VENTANA_MS });
    return;
  }
  registro.cantidad += 1;
}

export async function loginBloqueado(ip: string, email: string) {
  const id = clave(ip, email);

  try {
    const ahora = new Date();
    const registro = await prisma.intentoLogin.findUnique({
      where: { clave: id },
    });

    if (!registro || ahora > registro.reset) {
      return false;
    }

    return registro.cantidad >= MAX_INTENTOS;
  } catch (error) {
    if (tablaAusente(error)) {
      return bloqueadoEnMemoria(id);
    }
    throw error;
  }
}

export async function registrarLoginFallido(ip: string, email: string) {
  const id = clave(ip, email);
  const ahora = new Date();
  const reset = new Date(ahora.getTime() + VENTANA_MS);

  try {
    const registro = await prisma.intentoLogin.findUnique({
      where: { clave: id },
    });

    if (!registro || ahora > registro.reset) {
      await prisma.intentoLogin.upsert({
        where: { clave: id },
        create: { clave: id, cantidad: 1, reset },
        update: { cantidad: 1, reset },
      });
      return;
    }

    await prisma.intentoLogin.update({
      where: { clave: id },
      data: { cantidad: { increment: 1 } },
    });
  } catch (error) {
    if (tablaAusente(error)) {
      registrarEnMemoria(id);
      return;
    }
    throw error;
  }
}

export async function limpiarLoginFallidos(ip: string, email: string) {
  const id = clave(ip, email);
  memoria.delete(id);
  try {
    await prisma.intentoLogin.delete({ where: { clave: id } });
  } catch {
    /* sin fila o sin tabla: el login no debe fallar */
  }
}
