export const LIMITE_POR_PAGINA = 15;
export const LIMITE_EXPORTACION = 1000;
export const LIMITE_PAGINA_MAX = 1000;
export const MAX_PENDIENTES_SYNC = 50;
export const MAX_TEXTO_OBSERVACION = 4000;
export const MAX_BUSQUEDA = 80;
export const MIN_PASSWORD = 10;
export const MAX_PASSWORD = 128;

export function paginaLista(page?: number) {
  const n =
    Number.isFinite(page) && (page ?? 0) > 0
      ? Math.floor(page as number)
      : 1;
  return Math.min(n, LIMITE_PAGINA_MAX);
}

export function recortarBusqueda(valor?: string | null) {
  const texto = valor?.trim() ?? "";
  if (!texto) {
    return "";
  }
  return texto.slice(0, MAX_BUSQUEDA);
}

export function mensajePasswordInvalida(password: string) {
  if (password.length < MIN_PASSWORD) {
    return "password must be longer than or equal to 10 characters";
  }

  if (password.length > MAX_PASSWORD) {
    return "password must be shorter than or equal to 128 characters";
  }

  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password) || !/\d/.test(password)) {
    return "password must contain a letter and a number";
  }

  return null;
}

export type RolUsuario = "ADMIN" | "SUPERVISOR";

export type DecisionGestion =
  | "NO_REQUIERE"
  | "SEGUIMIENTO"
  | "CAPACITACION"
  | "SUPERVISION_INTENSIVA";

export type Clasificacion =
  | "CRITICO"
  | "REGULAR"
  | "BUENO"
  | "EXCELENTE";

export function calcularClasificacion(
  promedio: number,
): Clasificacion {
  if (promedio <= 2.5) {
    return "CRITICO";
  }

  if (promedio <= 3.5) {
    return "REGULAR";
  }

  if (promedio <= 4.5) {
    return "BUENO";
  }

  return "EXCELENTE";
}

export function calcularPromedio(
  puntuaciones: number[],
): number {
  if (puntuaciones.length === 0) {
    throw new Error(
      "La supervisión debe tener al menos una puntuación",
    );
  }

  for (const valor of puntuaciones) {
    if (
      !Number.isInteger(valor) ||
      valor < 1 ||
      valor > 5
    ) {
      throw new Error(
        "La puntuación de cada criterio debe ser un número entero entre 1 y 5",
      );
    }
  }

  const suma = puntuaciones.reduce(
    (total, valor) => total + valor,
    0,
  );

  return Number(
    (suma / puntuaciones.length).toFixed(2),
  );
}

export function hayCriteriosDuplicados(
  criterioIds: number[],
): boolean {
  return (
    new Set(criterioIds).size !==
    criterioIds.length
  );
}

export function pareceMojibake(valor: string) {
  return /Ã.|Â[¡-ÿ]|â€/.test(valor);
}

export function repararTexto(
  valor: string | null | undefined,
): string | null | undefined {
  if (valor == null) {
    return valor;
  }

  if (valor === "" || !pareceMojibake(valor)) {
    return valor;
  }

  let actual = valor;

  for (let i = 0; i < 3; i++) {
    if (!pareceMojibake(actual)) {
      break;
    }

    const codes = [];
    let valido = true;
    for (const caracter of actual) {
      const codigo = caracter.charCodeAt(0);
      if (codigo > 255) {
        valido = false;
        break;
      }
      codes.push(codigo);
    }

    if (!valido) {
      break;
    }

    const siguiente = new TextDecoder("utf-8", {
      fatal: false,
    }).decode(Uint8Array.from(codes));

    if (
      siguiente.includes("\uFFFD") ||
      siguiente === actual
    ) {
      break;
    }

    actual = siguiente;
  }

  return actual;
}

