export const LIMITE_POR_PAGINA = 15;

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

