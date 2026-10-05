const VENTANA_MS = 15 * 60 * 1000;
const MAX_INTENTOS = 10;

const intentos = new Map<string, { cantidad: number; reset: number }>();

function clave(ip: string, email: string) {
  return `${ip}|${email.trim().toLowerCase()}`;
}

export function ipDesdeRequest(request: Request) {
  const reenviada = request.headers.get("x-forwarded-for");
  if (reenviada) {
    return reenviada.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function loginBloqueado(ip: string, email: string) {
  const ahora = Date.now();
  const registro = intentos.get(clave(ip, email));
  if (!registro || ahora > registro.reset) {
    return false;
  }
  return registro.cantidad >= MAX_INTENTOS;
}

export function registrarLoginFallido(ip: string, email: string) {
  const ahora = Date.now();
  const id = clave(ip, email);
  const registro = intentos.get(id);

  if (!registro || ahora > registro.reset) {
    intentos.set(id, { cantidad: 1, reset: ahora + VENTANA_MS });
    return;
  }

  registro.cantidad += 1;
}

export function limpiarLoginFallidos(ip: string, email: string) {
  intentos.delete(clave(ip, email));
}
