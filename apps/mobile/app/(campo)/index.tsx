import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import type { Clasificacion } from "@supervision/domain";
import { clienteApi } from "../../src/api";
import { borrarSesion, leerUsuario } from "../../src/auth/storage";
import {
  leerMeta,
  listarSupervisionesRemotas,
} from "../../src/db/consultas";
import { formatearFechaHora } from "../../src/fechas";
import { etiquetasClasificacion, rangosClasificacion } from "../../src/etiquetas";
import {
  compartirPdf,
  htmlListadoSupervisiones,
  type SupervisionPdfListado,
} from "../../src/pdf";
import { pullCatalogos } from "../../src/sync/pull";
import {
  listarPendientes,
  pushSupervisionesPendientes,
} from "../../src/sync/push";

type MetricasCampo = {
  totalSupervisiones: number;
  supervisionesMes: number;
  promedioGeneral: number | null;
  clasificaciones: Record<Clasificacion, number>;
};

const vacias: MetricasCampo = {
  totalSupervisiones: 0,
  supervisionesMes: 0,
  promedioGeneral: null,
  clasificaciones: {
    CRITICO: 0,
    REGULAR: 0,
    BUENO: 0,
    EXCELENTE: 0,
  },
};

function metricasDesdeLocal(
  items: Awaited<ReturnType<typeof listarSupervisionesRemotas>>,
): MetricasCampo {
  const ahora = new Date();
  const clasificaciones = { ...vacias.clasificaciones };
  let suma = 0;
  let conPromedio = 0;
  let supervisionesMes = 0;

  for (const item of items) {
    const clave = item.clasificacion as Clasificacion | null;
    if (clave && clave in clasificaciones) {
      clasificaciones[clave] += 1;
    }
    if (item.promedio != null) {
      suma += Number(item.promedio);
      conPromedio += 1;
    }
    const fecha = new Date(item.fecha);
    if (
      !Number.isNaN(fecha.getTime()) &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    ) {
      supervisionesMes += 1;
    }
  }

  return {
    totalSupervisiones: items.length,
    supervisionesMes,
    promedioGeneral:
      conPromedio === 0 ? null : Number((suma / conPromedio).toFixed(2)),
    clasificaciones,
  };
}

export default function CampoHome() {
  const [nombre, setNombre] = useState("");
  const [pulledAt, setPulledAt] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [metricas, setMetricas] = useState<MetricasCampo>(vacias);
  const [exportando, setExportando] = useState(false);

  const recargar = useCallback(async () => {
    const usuario = await leerUsuario();
    setNombre(usuario ? `${usuario.nombre} ${usuario.apellido}` : "");
    setPulledAt(await leerMeta("pulledAt"));
    const lista = await listarPendientes();
    setPendientes(
      lista.filter((item) => item.estado !== "sincronizada").length,
    );

    try {
      const datos = (await clienteApi().misMetricas()) as MetricasCampo & {
        promedioGeneral?: number | string | null;
      };
      setMetricas({
        totalSupervisiones: Number(datos.totalSupervisiones ?? 0),
        supervisionesMes: Number(datos.supervisionesMes ?? 0),
        promedioGeneral:
          datos.promedioGeneral == null
            ? null
            : Number(datos.promedioGeneral),
        clasificaciones: {
          CRITICO: Number(datos.clasificaciones?.CRITICO ?? 0),
          REGULAR: Number(datos.clasificaciones?.REGULAR ?? 0),
          BUENO: Number(datos.clasificaciones?.BUENO ?? 0),
          EXCELENTE: Number(datos.clasificaciones?.EXCELENTE ?? 0),
        },
      });
    } catch {
      setMetricas(metricasDesdeLocal(await listarSupervisionesRemotas()));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  async function sincronizar() {
    setMensaje("");
    try {
      await pullCatalogos();
      const { enviados, errores } = await pushSupervisionesPendientes();
      setMensaje(
        `Catálogo actualizado. Enviadas: ${enviados}. Con error: ${errores}.`,
      );
      await recargar();
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudo sincronizar.",
      );
    }
  }

  async function exportarPdf() {
    setMensaje("");
    setExportando(true);
    try {
      const usuario = await leerUsuario();
      const datos = (await clienteApi().exportacion()) as SupervisionPdfListado[];
      if (!Array.isArray(datos) || datos.length === 0) {
        setMensaje("No tiene supervisiones para exportar.");
        return;
      }
      await compartirPdf(
        htmlListadoSupervisiones({
          titulo: "Reporte de mis supervisiones",
          supervisor: usuario
            ? `${usuario.nombre} ${usuario.apellido}`
            : undefined,
          supervisiones: datos,
        }),
        "mis-supervisiones",
      );
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudo generar el PDF.",
      );
    } finally {
      setExportando(false);
    }
  }

  async function salir() {
    await borrarSesion();
    router.replace("/login");
  }

  const totalClas =
    metricas.clasificaciones.CRITICO +
    metricas.clasificaciones.REGULAR +
    metricas.clasificaciones.BUENO +
    metricas.clasificaciones.EXCELENTE;
  const ancho = (valor: number) =>
    totalClas === 0 ? 0 : (valor / totalClas) * 100;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 32 }}
    >
      <Text style={{ color: "#2563eb", fontSize: 12, fontWeight: "600" }}>
        Panel de control
      </Text>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Mi actividad</Text>
      <Text>{nombre}</Text>
      <Text style={{ color: "#64748b" }}>
        Resumen de las supervisiones que ha realizado y sus resultados.
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Tarjeta
          titulo="Mis supervisiones"
          valor={String(metricas.totalSupervisiones)}
          detalle="Realizadas por usted"
        />
        <Tarjeta
          titulo="Este mes"
          valor={String(metricas.supervisionesMes)}
          detalle="Sus supervisiones"
        />
        <Tarjeta
          titulo="Promedio general"
          valor={
            metricas.promedioGeneral == null
              ? "-"
              : metricas.promedioGeneral.toFixed(2)
          }
          detalle="Promedio de sus evaluaciones"
        />
      </View>

      <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 8 }}>
        Resultados de las supervisiones
      </Text>
      <Text style={{ color: "#64748b" }}>
        Distribución de sus supervisiones según la clasificación obtenida.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {rangosClasificacion.map(([clave, rango, color]) => (
          <Tarjeta
            key={clave}
            titulo={etiquetasClasificacion[clave]}
            valor={String(metricas.clasificaciones[clave])}
            detalle={rango}
            fondo={color}
            claro
          />
        ))}
      </View>

      <View
        style={{
          marginTop: 4,
          borderTopWidth: 1,
          borderColor: "#f1f5f9",
          paddingTop: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
            <Text style={{ fontWeight: "600" }}>Distribución</Text>
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>
              Proporción según clasificación
            </Text>
          </View>
          <Text style={{ color: "#64748b", fontSize: 12 }}>
            {totalClas} {totalClas === 1 ? "supervisión" : "supervisiones"}
          </Text>
        </View>
        <View
          style={{
            marginTop: 10,
            height: 12,
            borderRadius: 999,
            backgroundColor: "#f1f5f9",
            overflow: "hidden",
            flexDirection: "row",
          }}
        >
          {rangosClasificacion.map(([clave, , color]) => {
            const valor = metricas.clasificaciones[clave];
            if (valor <= 0) {
              return null;
            }
            return (
              <View
                key={clave}
                style={{
                  width: `${ancho(valor)}%`,
                  backgroundColor: color,
                }}
              />
            );
          })}
        </View>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 10,
          }}
        >
          {rangosClasificacion.map(([clave, , color]) => (
            <View
              key={clave}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: color,
                }}
              />
              <Text style={{ color: "#64748b", fontSize: 12 }}>
                {etiquetasClasificacion[clave]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ color: "#64748b", fontSize: 12 }}>
        Último pull: {pulledAt ? formatearFechaHora(pulledAt) : "nunca"}
      </Text>
      <Text>Pendientes de envío: {pendientes}</Text>
      {mensaje ? <Text>{mensaje}</Text> : null}

      <Pressable onPress={() => void sincronizar()} style={boton}>
        <Text style={botonTexto}>Sincronizar</Text>
      </Pressable>

      <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 4 }}>
        Accesos rápidos
      </Text>
      <Text style={{ color: "#64748b" }}>
        Acceda a las funciones más utilizadas del sistema.
      </Text>

      <Pressable
        onPress={() => void exportarPdf()}
        disabled={exportando}
        style={botonSec}
      >
        <Text>{exportando ? "Generando PDF..." : "Exportar reporte PDF"}</Text>
      </Pressable>
      <Link href="/(campo)/nueva" asChild>
        <Pressable style={boton}>
          <Text style={botonTexto}>Nueva supervisión</Text>
        </Pressable>
      </Link>
      <Link href="/(campo)/agentes" asChild>
        <Pressable style={botonSec}>
          <Text>Agentes sanitarios</Text>
        </Pressable>
      </Link>
      <Link href="/(campo)/pendientes" asChild>
        <Pressable style={botonSec}>
          <Text>Cola de envío</Text>
        </Pressable>
      </Link>
      <Link href="/(campo)/historial" asChild>
        <Pressable style={botonSec}>
          <Text>Mis supervisiones</Text>
        </Pressable>
      </Link>
      <Pressable onPress={() => void salir()}>
        <Text style={{ color: "#b91c1c", marginTop: 12 }}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function Tarjeta({
  titulo,
  valor,
  detalle,
  fondo,
  claro,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  fondo?: string;
  claro?: boolean;
}) {
  const texto = claro ? "#ffffff" : "#64748b";
  const valorColor = claro ? "#ffffff" : "#0f172a";
  const detalleColor = claro ? "rgba(255,255,255,0.8)" : "#94a3b8";

  return (
    <View
      style={{
        minWidth: "30%",
        flexGrow: 1,
        borderWidth: 1,
        borderColor: fondo ?? "#e2e8f0",
        backgroundColor: fondo ?? "white",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <Text style={{ color: texto, fontSize: 12 }}>{titulo}</Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginTop: 4,
          color: valorColor,
        }}
      >
        {valor}
      </Text>
      <Text style={{ color: detalleColor, fontSize: 11, marginTop: 4 }}>
        {detalle}
      </Text>
    </View>
  );
}

const boton = {
  backgroundColor: "#0f172a",
  padding: 14,
  borderRadius: 8,
};
const botonTexto = { color: "white", textAlign: "center" as const };
const botonSec = {
  borderWidth: 1,
  borderColor: "#cbd5e1",
  padding: 14,
  borderRadius: 8,
};
