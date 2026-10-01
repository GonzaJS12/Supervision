"use client";

import { useState } from "react";
import { etiquetasClasificacion, etiquetasGestion, formatearFecha } from "@/lib/etiquetas";

type SupervisionExport = {
  fecha: string;
  promedio: number | null;
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
  sector: { numero?: number; nombre?: string | null } | null;
};

export function BotonExportarPdf({
  titulo,
  supervisor,
}: {
  titulo: string;
  supervisor?: string;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function exportar() {
    setCargando(true);
    setError("");

    const respuesta = await fetch("/api/v1/supervisiones/exportacion");
    const data = (await respuesta.json()) as
      | SupervisionExport[]
      | { error?: string };

    if (!respuesta.ok || !Array.isArray(data)) {
      setError(
        !Array.isArray(data) && data.error
          ? data.error
          : "No se pudo exportar",
      );
      setCargando(false);
      return;
    }

    if (data.length === 0) {
      setError("No hay supervisiones para exportar.");
      setCargando(false);
      return;
    }

    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const documento = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    documento.setFontSize(16);
    documento.text("Sistema de Supervisión de Agentes Sanitarios", 14, 16);
    documento.setFontSize(12);
    documento.text(titulo, 14, 24);
    documento.setFontSize(9);

    let y = 30;
    if (supervisor) {
      documento.text(`Supervisor: ${supervisor}`, 14, y);
      y += 5;
    }

    documento.text(
      `Fecha de generación: ${new Date().toLocaleString("es-AR")}`,
      14,
      y,
    );
    y += 5;
    documento.text(`Total de supervisiones: ${data.length}`, 14, y);

    autoTable(documento, {
      startY: y + 6,
      head: [
        [
          "Fecha",
          "Agente",
          "Documento",
          "Legajo",
          "Área",
          "Sector",
          "Supervisor",
          "Promedio",
          "Clasificación",
          "Gestión",
        ],
      ],
      body: data.map((item) => [
        formatearFecha(item.fecha),
        `${item.agenteSanitario.apellido}, ${item.agenteSanitario.nombre}`,
        item.agenteSanitario.documento ?? "-",
        item.agenteSanitario.legajo ?? "-",
        item.areaOperativa.nombre,
        item.sector
          ? item.sector.nombre ?? `Sector ${item.sector.numero ?? ""}`
          : "Sin sector asignado",
        `${item.supervisor.apellido}, ${item.supervisor.nombre}`,
        item.promedio == null ? "-" : item.promedio.toFixed(2),
        item.clasificacion
          ? etiquetasClasificacion[item.clasificacion]
          : "-",
        etiquetasGestion[item.decisionGestion],
      ]),
      styles: { fontSize: 8 },
    });

    documento.save("supervisiones.pdf");
    setCargando(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void exportar()}
        disabled={cargando}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
      >
        {cargando ? "Exportando..." : "Exportar PDF"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
