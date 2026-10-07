"use client";

import { useState } from "react";
import { extraerMensajeApi } from "@/lib/mensaje-api";
import { ds } from "@/lib/ds";
import { etiquetasClasificacion, etiquetasGestion, formatearFecha, formatearFechaHora } from "@/lib/etiquetas";

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
  nombreArchivo,
  etiqueta = "Exportar PDF",
  etiquetaCargando = "Generando PDF...",
  vacio = "No hay supervisiones para exportar.",
  deshabilitado = false,
}: {
  titulo: string;
  supervisor?: string;
  nombreArchivo: string;
  etiqueta?: string;
  etiquetaCargando?: string;
  vacio?: string;
  deshabilitado?: boolean;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function exportar() {
    setCargando(true);
    setError("");

    const respuesta = await fetch("/api/v1/supervisiones/exportacion");
    const data = (await respuesta.json()) as
      | SupervisionExport[]
      | { error?: string; message?: string };

    if (!respuesta.ok || !Array.isArray(data)) {
      setError(
        extraerMensajeApi(
          data as { error?: string; message?: string | string[] },
          "No se pudo generar el PDF de supervisiones.",
        ),
      );
      setCargando(false);
      return;
    }

    if (data.length === 0) {
      setError(vacio);
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

    documento.setFontSize(18);
    documento.text("Sistema de Supervisión de Agentes Sanitarios", 14, 16);
    documento.setFontSize(13);
    documento.text(titulo, 14, 25);
    documento.setFontSize(9);

    let y = 32;
    if (supervisor) {
      documento.text(`Supervisor: ${supervisor}`, 14, y);
      y += 5;
    }

    documento.text(
      `Fecha de generación: ${formatearFechaHora(new Date())}`,
      14,
      y,
    );
    y += 5;
    documento.text(`Total de supervisiones: ${data.length}`, 14, y);

    autoTable(documento, {
      startY: y + 7,
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
        `${item.supervisor.nombre} ${item.supervisor.apellido}`,
        item.promedio !== null && item.promedio !== undefined
          ? Number(item.promedio).toFixed(2)
          : "-",
        item.clasificacion
          ? etiquetasClasificacion[item.clasificacion]
          : "-",
        etiquetasGestion[item.decisionGestion],
      ]),
      styles: { fontSize: 7, cellPadding: 2, valign: "middle" },
      headStyles: { fontStyle: "bold" },
      margin: { left: 10, right: 10 },
      didDrawPage: (hook) => {
        const numeroPagina = documento.getNumberOfPages();
        documento.setFontSize(8);
        documento.text(
          `Página ${numeroPagina}`,
          documento.internal.pageSize.getWidth() - 25,
          documento.internal.pageSize.getHeight() - 7,
        );
        if (hook.pageNumber > 1) {
          documento.setFontSize(9);
          documento.text(titulo, 14, 10);
        }
      },
    });

    const fechaArchivo = new Date().toISOString().slice(0, 10);
    documento.save(`${nombreArchivo}-${fechaArchivo}.pdf`);
    setCargando(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void exportar()}
        disabled={cargando || deshabilitado}
        className={ds.botonSecundario}
      >
        {cargando ? etiquetaCargando : etiqueta}
      </button>
      {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
