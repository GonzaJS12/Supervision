const NOMBRES_HTTP = new Set([
  "Bad Request",
  "Unauthorized",
  "Forbidden",
  "Not Found",
  "Conflict",
  "Internal Server Error",
]);

export function extraerMensajeApi(
  datos: { error?: unknown; message?: unknown },
  fallback: string,
) {
  if (Array.isArray(datos.message)) {
    const partes = datos.message.filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
    if (partes.length > 0) {
      return partes.join(", ");
    }
  }

  if (typeof datos.message === "string" && datos.message.length > 0) {
    return datos.message;
  }

  if (
    typeof datos.error === "string" &&
    datos.error.length > 0 &&
    !NOMBRES_HTTP.has(datos.error)
  ) {
    return datos.error;
  }

  return fallback;
}
