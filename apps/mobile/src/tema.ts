export const color = {
  primario: "#2563eb",
  primarioHover: "#1d4ed8",
  primarioSuave: "#eff6ff",
  fondo: "#f8fafc",
  superficie: "#ffffff",
  borde: "#e2e8f0",
  texto: "#0f172a",
  textoMedio: "#475569",
  textoSuave: "#64748b",
  exito: "#059669",
  exitoSuave: "#ecfdf5",
  aviso: "#d97706",
  avisoSuave: "#fffbeb",
  error: "#b91c1c",
  errorSuave: "#fef2f2",
} as const;

export const radio = 12;
export const toque = 48;

export const clasificacionUi = {
  CRITICO: { barra: "#f87171", fondo: "#fef2f2", texto: "#991b1b" },
  REGULAR: { barra: "#fbbf24", fondo: "#fffbeb", texto: "#92400e" },
  BUENO: { barra: "#60a5fa", fondo: "#eff6ff", texto: "#1e40af" },
  EXCELENTE: { barra: "#34d399", fondo: "#ecfdf5", texto: "#065f46" },
} as const;

export const botonPrimario = {
  backgroundColor: color.primario,
  minHeight: toque,
  borderRadius: radio,
  paddingVertical: 14,
  paddingHorizontal: 16,
  justifyContent: "center" as const,
  alignItems: "center" as const,
};

export const botonPrimarioTexto = {
  color: "#ffffff",
  textAlign: "center" as const,
  fontWeight: "600" as const,
  fontSize: 15,
};

export const botonSecundario = {
  backgroundColor: color.superficie,
  borderWidth: 1,
  borderColor: color.borde,
  minHeight: toque,
  borderRadius: radio,
  paddingVertical: 14,
  paddingHorizontal: 16,
  justifyContent: "center" as const,
  alignItems: "center" as const,
};

export const botonSecundarioTexto = {
  color: color.texto,
  textAlign: "center" as const,
  fontWeight: "600" as const,
  fontSize: 15,
};

export const campo = {
  borderWidth: 1,
  borderColor: color.borde,
  backgroundColor: color.superficie,
  borderRadius: radio,
  minHeight: toque,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
  color: color.texto,
};

export const tarjeta = {
  backgroundColor: color.superficie,
  borderWidth: 1,
  borderColor: color.borde,
  borderRadius: radio,
  padding: 16,
};
