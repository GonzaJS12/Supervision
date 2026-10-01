import type {
  Clasificacion,
  DecisionGestion,
} from "@supervision/domain";

export const etiquetasClasificacion: Record<
  Clasificacion,
  string
> = {
  CRITICO: "Crítico",
  REGULAR: "Regular",
  BUENO: "Bueno",
  EXCELENTE: "Excelente",
};

export const etiquetasGestion: Record<
  DecisionGestion,
  string
> = {
  NO_REQUIERE: "No requiere",
  SEGUIMIENTO: "Seguimiento",
  CAPACITACION: "Capacitación",
  SUPERVISION_INTENSIVA: "Supervisión intensiva",
};

export function formatearFecha(valor: Date | string) {
  const fecha = typeof valor === "string" ? new Date(valor) : valor;

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleDateString("es-AR");
}
