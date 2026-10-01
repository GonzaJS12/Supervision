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
        "Cada puntuación debe ser un entero entre 1 y 5",
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
