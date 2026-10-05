import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { Clasificacion, DecisionGestion } from "@supervision/domain";
import { clienteApi } from "../../../src/api";
import {
  descripcionesGestion,
  escalaPuntuacion,
  etiquetasClasificacion,
  etiquetasGestion,
} from "../../../src/etiquetas";
import { formatearFecha } from "../../../src/fechas";
import {
  compartirPdf,
  htmlDetalleSupervision,
} from "../../../src/pdf";

type Detalle = {
  fecha: string;
  promedio: number | string | null;
  clasificacion: Clasificacion | null;
  decisionGestion: DecisionGestion;
  familiaNumero: number | null;
  fortalezas: string | null;
  oportunidadesMejora: string | null;
  situacionesCriticas: string | null;
  recomendaciones: string | null;
  agenteSanitario: { nombre: string; apellido: string };
  supervisor: { nombre: string; apellido: string };
  areaOperativa: { nombre: string };
  sector: { nombre: string | null; numero: number | null } | null;
  ronda: { nombre: string } | null;
  evaluaciones: Array<{
    id: number;
    criterioNombre: string;
    criterioDescripcion: string | null;
    puntuacion: number;
  }>;
};

export default function DetalleHistorialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [error, setError] = useState("");
  const [errorPdf, setErrorPdf] = useState("");
  const [supervision, setSupervision] = useState<Detalle | null>(null);
  const [exportando, setExportando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (!id || !/^\d+$/.test(id)) {
          setError("No se indicó una supervisión.");
          return;
        }
        try {
          const datos = (await clienteApi().supervision(
            Number(id),
          )) as Detalle;
          setSupervision(datos);
          setError("");
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la supervisión.",
          );
        }
      })();
    }, [id]),
  );

  if (error || !supervision) {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontWeight: "700" }}>
          No se pudo mostrar la supervisión
        </Text>
        <Text>{error || "Cargando..."}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "#2563eb" }}>Volver al historial</Text>
        </Pressable>
      </View>
    );
  }

  const promedio =
    supervision.promedio == null ? null : Number(supervision.promedio);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#2563eb" }}>Volver al historial</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          void (async () => {
            setExportando(true);
            setErrorPdf("");
            try {
              await compartirPdf(
                htmlDetalleSupervision(supervision),
                "supervision",
              );
            } catch (err) {
              setErrorPdf(
                err instanceof Error
                  ? err.message
                  : "No se pudo generar el PDF.",
              );
            } finally {
              setExportando(false);
            }
          })();
        }}
        disabled={exportando}
        style={{
          backgroundColor: "#0f172a",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          {exportando ? "Generando PDF..." : "Exportar PDF"}
        </Text>
      </Pressable>
      {errorPdf ? (
        <Text style={{ color: "#b91c1c" }}>{errorPdf}</Text>
      ) : null}
      <Text style={{ fontSize: 20, fontWeight: "700" }}>
        Detalle de supervisión
      </Text>
      <Texto
        etiqueta="Agente sanitario"
        valor={`${supervision.agenteSanitario.apellido}, ${supervision.agenteSanitario.nombre}`}
      />
      <Texto
        etiqueta="Supervisor"
        valor={`${supervision.supervisor.nombre} ${supervision.supervisor.apellido}`}
      />
      <Texto etiqueta="Fecha" valor={formatearFecha(supervision.fecha)} />
      <Texto etiqueta="Área operativa" valor={supervision.areaOperativa.nombre} />
      <Texto
        etiqueta="Sector"
        valor={
          supervision.sector
            ? supervision.sector.nombre ??
              `Sector ${supervision.sector.numero ?? ""}`
            : "Sin sector asignado"
        }
      />
      <Texto
        etiqueta="Familia N°"
        valor={
          supervision.familiaNumero == null
            ? "No especificado"
            : String(supervision.familiaNumero)
        }
      />
      <Texto
        etiqueta="Ronda"
        valor={supervision.ronda?.nombre ?? "No especificada"}
      />

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Evaluación</Text>
      {escalaPuntuacion.map((item) => (
        <Text key={item.valor} style={{ color: "#64748b", fontSize: 12 }}>
          {item.valor} · {item.texto}
        </Text>
      ))}
      {supervision.evaluaciones.map((item) => (
        <View key={item.id} style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: "600" }}>{item.criterioNombre}</Text>
          {item.criterioDescripcion ? (
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              {item.criterioDescripcion}
            </Text>
          ) : null}
          <Text>Puntuación: {item.puntuacion}</Text>
        </View>
      ))}

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Observaciones</Text>
      <Texto
        etiqueta="Fortalezas"
        valor={supervision.fortalezas?.trim() || "Sin observaciones registradas."}
      />
      <Texto
        etiqueta="Oportunidades de mejora"
        valor={
          supervision.oportunidadesMejora?.trim() ||
          "Sin observaciones registradas."
        }
      />
      <Texto
        etiqueta="Situaciones críticas"
        valor={
          supervision.situacionesCriticas?.trim() ||
          "Sin observaciones registradas."
        }
      />
      <Texto
        etiqueta="Recomendaciones"
        valor={
          supervision.recomendaciones?.trim() ||
          "Sin observaciones registradas."
        }
      />

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Resultado general</Text>
      <Text>
        Promedio:{" "}
        {promedio !== null && !Number.isNaN(promedio)
          ? promedio.toFixed(2)
          : "—"}{" "}
        / 5.00
      </Text>
      <Text>
        Clasificación:{" "}
        {supervision.clasificacion
          ? etiquetasClasificacion[supervision.clasificacion]
          : "—"}
      </Text>
      <Text>
        Decisión de gestión: {etiquetasGestion[supervision.decisionGestion]}
      </Text>
      <Text style={{ color: "#64748b" }}>
        {descripcionesGestion[supervision.decisionGestion]}
      </Text>
    </ScrollView>
  );
}

function Texto({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Text>
      <Text style={{ color: "#64748b" }}>{etiqueta}: </Text>
      {valor}
    </Text>
  );
}
