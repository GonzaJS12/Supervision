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

export const descripcionesGestion: Record<
  DecisionGestion,
  string
> = {
  NO_REQUIERE: "No se indicó una intervención adicional.",
  SEGUIMIENTO: "Se indicó realizar seguimiento del agente.",
  CAPACITACION: "Se indicó una acción de capacitación.",
  SUPERVISION_INTENSIVA: "Se indicó una supervisión intensiva.",
};

export const ayudasGestion: Record<DecisionGestion, string> = {
  NO_REQUIERE: "Sin intervención adicional.",
  SEGUIMIENTO: "Requiere seguimiento posterior.",
  CAPACITACION: "Requiere fortalecimiento o capacitación.",
  SUPERVISION_INTENSIVA: "Requiere una intervención prioritaria.",
};

export const rangosClasificacion: Array<[Clasificacion, string, string]> = [
  ["CRITICO", "1.0 – 2.5", "#ef4444"],
  ["REGULAR", "2.6 – 3.5", "#f59e0b"],
  ["BUENO", "3.6 – 4.5", "#3b82f6"],
  ["EXCELENTE", "4.6 – 5.0", "#10b981"],
];

export const escalaPuntuacion = [
  { valor: 1, texto: "Muy deficiente" },
  { valor: 2, texto: "Deficiente" },
  { valor: 3, texto: "Regular" },
  { valor: 4, texto: "Bueno" },
  { valor: 5, texto: "Excelente" },
] as const;

export function formatearPromedio(valor: unknown) {
  if (valor == null || valor === "") {
    return "—";
  }

  const numero = Number(valor);
  return Number.isNaN(numero) ? "—" : numero.toFixed(2);
}

const ZONA_AR = "America/Argentina/Buenos_Aires";

function comoFecha(valor: Date | string) {
  const fecha = typeof valor === "string" ? new Date(valor) : valor;
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function parte(partes: Intl.DateTimeFormatPart[], tipo: Intl.DateTimeFormatPartTypes) {
  return partes.find((item) => item.type === tipo)?.value ?? "";
}

export function hoyEnDdMmAaaa(valor: Date | string = new Date()) {
  const fecha = comoFecha(valor);
  if (!fecha) {
    return "";
  }

  const partes = new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_AR,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(fecha);

  return `${parte(partes, "day")}/${parte(partes, "month")}/${parte(partes, "year")}`;
}

export function formatearFecha(valor: Date | string) {
  const fecha = comoFecha(valor);
  if (!fecha) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_AR,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}

export function formatearFechaHora(valor: Date | string) {
  const fecha = comoFecha(valor);
  if (!fecha) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_AR,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}
