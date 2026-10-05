import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  etiquetasClasificacion,
  etiquetasGestion,
  escalaPuntuacion,
} from "./etiquetas";
import { formatearFecha, formatearFechaHora } from "./fechas";

export type SupervisionPdfListado = {
  fecha: string;
  promedio: number | string | null;
  clasificacion: keyof typeof etiquetasClasificacion | null;
  decisionGestion: keyof typeof etiquetasGestion;
  agenteSanitario: {
    nombre: string;
    apellido: string;
    documento?: string | null;
    legajo?: string | null;
  };
  supervisor: { nombre: string; apellido: string };
  areaOperativa: { nombre: string };
  sector: { numero?: number | null; nombre?: string | null } | null;
};

export type SupervisionPdfDetalle = SupervisionPdfListado & {
  familiaNumero: number | null;
  ronda: { nombre: string } | null;
  fortalezas: string | null;
  oportunidadesMejora: string | null;
  situacionesCriticas: string | null;
  recomendaciones: string | null;
  evaluaciones: Array<{
    id: number;
    criterioNombre: string;
    criterioDescripcion: string | null;
    puntuacion: number;
  }>;
};

function htmlEscapar(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function celda(valor: string | null | undefined) {
  const texto = valor?.trim() ? valor : "-";
  return htmlEscapar(texto);
}

function promedioTexto(valor: number | string | null | undefined) {
  if (valor == null || valor === "") {
    return "-";
  }
  const numero = Number(valor);
  return Number.isNaN(numero) ? "-" : numero.toFixed(2);
}

function envoltorio(titulo: string, cuerpo: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${htmlEscapar(titulo)}</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; padding: 24px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 0 0 16px; font-weight: 600; }
    p { font-size: 11px; margin: 0 0 6px; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    .obs { margin-top: 16px; }
    .obs p { margin-bottom: 8px; }
  </style>
</head>
<body>
${cuerpo}
</body>
</html>`;
}

export function htmlListadoSupervisiones(params: {
  titulo: string;
  supervisor?: string;
  supervisiones: SupervisionPdfListado[];
}) {
  const filas = params.supervisiones
    .map((item) => {
      const sector = item.sector
        ? item.sector.nombre ?? `Sector ${item.sector.numero ?? ""}`
        : "Sin sector asignado";
      return `<tr>
        <td>${celda(formatearFecha(item.fecha))}</td>
        <td>${celda(`${item.agenteSanitario.apellido}, ${item.agenteSanitario.nombre}`)}</td>
        <td>${celda(item.agenteSanitario.documento)}</td>
        <td>${celda(item.agenteSanitario.legajo)}</td>
        <td>${celda(item.areaOperativa.nombre)}</td>
        <td>${celda(sector)}</td>
        <td>${celda(`${item.supervisor.nombre} ${item.supervisor.apellido}`)}</td>
        <td>${celda(promedioTexto(item.promedio))}</td>
        <td>${celda(item.clasificacion ? etiquetasClasificacion[item.clasificacion] : "-")}</td>
        <td>${celda(etiquetasGestion[item.decisionGestion])}</td>
      </tr>`;
    })
    .join("");

  return envoltorio(
    params.titulo,
    `<h1>Sistema de Supervisión de Agentes Sanitarios</h1>
     <h2>${htmlEscapar(params.titulo)}</h2>
     ${params.supervisor ? `<p>Supervisor: ${htmlEscapar(params.supervisor)}</p>` : ""}
     <p>Fecha de generación: ${htmlEscapar(formatearFechaHora(new Date()))}</p>
     <p>Total de supervisiones: ${params.supervisiones.length}</p>
     <table>
       <thead>
         <tr>
           <th>Fecha</th><th>Agente</th><th>Documento</th><th>Legajo</th>
           <th>Área</th><th>Sector</th><th>Supervisor</th>
           <th>Promedio</th><th>Clasificación</th><th>Gestión</th>
         </tr>
       </thead>
       <tbody>${filas}</tbody>
     </table>`,
  );
}

export function htmlDetalleSupervision(supervision: SupervisionPdfDetalle) {
  const sector = supervision.sector
    ? supervision.sector.nombre ??
      `Sector ${supervision.sector.numero ?? ""}`
    : "Sin sector asignado";
  const evaluaciones = supervision.evaluaciones
    .map(
      (item) => `<tr>
        <td>${celda(item.criterioNombre)}${
          item.criterioDescripcion
            ? `<br/><span style="color:#64748b">${celda(item.criterioDescripcion)}</span>`
            : ""
        }</td>
        <td>${item.puntuacion}</td>
      </tr>`,
    )
    .join("");
  const escala = escalaPuntuacion
    .map((item) => `${item.valor} ${item.texto}`)
    .join(" · ");

  return envoltorio(
    "Detalle de supervisión",
    `<h1>Sistema de Supervisión de Agentes Sanitarios</h1>
     <h2>Detalle de supervisión</h2>
     <p>Fecha de generación: ${htmlEscapar(formatearFechaHora(new Date()))}</p>
     <p>Agente: ${htmlEscapar(`${supervision.agenteSanitario.apellido}, ${supervision.agenteSanitario.nombre}`)}</p>
     <p>Supervisor: ${htmlEscapar(`${supervision.supervisor.nombre} ${supervision.supervisor.apellido}`)}</p>
     <p>Fecha: ${htmlEscapar(formatearFecha(supervision.fecha))}</p>
     <p>Área operativa: ${htmlEscapar(supervision.areaOperativa.nombre)}</p>
     <p>Sector: ${htmlEscapar(sector)}</p>
     <p>Familia N°: ${htmlEscapar(
       supervision.familiaNumero == null
         ? "No especificado"
         : String(supervision.familiaNumero),
     )}</p>
     <p>Ronda: ${htmlEscapar(supervision.ronda?.nombre ?? "No especificada")}</p>
     <p>Escala: ${htmlEscapar(escala)}</p>
     <table>
       <thead><tr><th>Criterio</th><th>Puntuación</th></tr></thead>
       <tbody>${evaluaciones || `<tr><td colspan="2">No hay evaluaciones registradas.</td></tr>`}</tbody>
     </table>
     <div class="obs">
       <p><strong>Fortalezas:</strong> ${celda(supervision.fortalezas?.trim() || "Sin observaciones registradas.")}</p>
       <p><strong>Oportunidades de mejora:</strong> ${celda(supervision.oportunidadesMejora?.trim() || "Sin observaciones registradas.")}</p>
       <p><strong>Situaciones críticas:</strong> ${celda(supervision.situacionesCriticas?.trim() || "Sin observaciones registradas.")}</p>
       <p><strong>Recomendaciones:</strong> ${celda(supervision.recomendaciones?.trim() || "Sin observaciones registradas.")}</p>
     </div>
     <p>Promedio: ${htmlEscapar(promedioTexto(supervision.promedio))} / 5.00</p>
     <p>Clasificación: ${htmlEscapar(
       supervision.clasificacion
         ? etiquetasClasificacion[supervision.clasificacion]
         : "—",
     )}</p>
     <p>Decisión de gestión: ${htmlEscapar(etiquetasGestion[supervision.decisionGestion])}</p>`,
  );
}

export async function compartirPdf(html: string, nombreArchivo: string) {
  const FileSystem = await import("expo-file-system/legacy");
  const seguro = nombreArchivo.replace(/[^\w.-]+/g, "-");
  const destino = `${FileSystem.cacheDirectory}${seguro}-${Date.now()}.pdf`;

  const generado = await Print.printToFileAsync({
    html,
    base64: true,
  });

  if (generado.base64) {
    await FileSystem.writeAsStringAsync(destino, generado.base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else if (generado.uri) {
    await FileSystem.copyAsync({ from: generado.uri, to: destino });
  }

  const disponible = await Sharing.isAvailableAsync();

  try {
    if (disponible && Platform.OS !== "web") {
      await Sharing.shareAsync(destino, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: nombreArchivo,
      });
      return;
    }
  } catch {
    /*
     * En Android a veces Compartir no puede leer el archivo;
     * el diálogo de impresión nativo sí.
     */
  }

  await Print.printAsync({ html });
}
