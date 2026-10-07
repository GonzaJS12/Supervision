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
import { etiquetasClasificacion } from "../../src/etiquetas";
import {
  botonPrimario,
  botonPrimarioTexto,
  clasificacionUi,
  color,
  tarjeta,
} from "../../src/tema";
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
      style={{ flex: 1, backgroundColor: color.fondo }}
      contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 32 }}
    >
      <Text
        style={{
          color: color.primario,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        Panel de control
      </Text>
      <Text style={{ fontSize: 24, fontWeight: "700", color: color.texto }}>
        Mi actividad
      </Text>
      <Text style={{ color: color.texto }}>{nombre}</Text>
      <Text style={{ color: color.textoSuave, lineHeight: 20 }}>
        Resumen de las supervisiones que ha realizado y sus resultados.
      </Text>

      <View
        style={{
          ...tarjeta,
          backgroundColor:
            pendientes > 0 ? color.avisoSuave : color.exitoSuave,
          borderColor: pendientes > 0 ? "#fde68a" : "#a7f3d0",
        }}
      >
        <Text style={{ fontWeight: "700", color: color.texto }}>
          {pendientes > 0
            ? `${pendientes} pendiente${pendientes === 1 ? "" : "s"} de envío`
            : "Sin pendientes de envío"}
        </Text>
        <Text style={{ color: color.textoSuave, marginTop: 4, fontSize: 12 }}>
          Última sincronización:{" "}
          {pulledAt ? formatearFechaHora(pulledAt) : "nunca"}
        </Text>
      </View>

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
        {Object.entries(clasificacionUi).map(([clave, ui]) => (
          <Tarjeta
            key={clave}
            titulo={etiquetasClasificacion[clave as keyof typeof etiquetasClasificacion]}
            valor={String(
              metricas.clasificaciones[
                clave as keyof typeof metricas.clasificaciones
              ],
            )}
            detalle={
              clave === "CRITICO"
                ? "1.0 – 2.5"
                : clave === "REGULAR"
                  ? "2.6 – 3.5"
                  : clave === "BUENO"
                    ? "3.6 – 4.5"
                    : "4.6 – 5.0"
            }
            fondo={ui.fondo}
            texto={ui.texto}
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
          {(Object.keys(clasificacionUi) as Clasificacion[]).map((clave) => {
            const valor = metricas.clasificaciones[clave];
            if (valor <= 0) {
              return null;
            }
            return (
              <View
                key={clave}
                style={{
                  width: `${ancho(valor)}%`,
                  backgroundColor: clasificacionUi[clave].barra,
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
          {(Object.keys(clasificacionUi) as Clasificacion[]).map((clave) => (
            <View
              key={clave}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: clasificacionUi[clave].barra,
                }}
              />
              <Text style={{ color: color.textoSuave, fontSize: 12 }}>
                {etiquetasClasificacion[clave]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {mensaje ? (
        <Text style={{ color: color.textoMedio }}>{mensaje}</Text>
      ) : null}

      <Pressable onPress={() => void sincronizar()} style={botonPrimario}>
        <Text style={botonPrimarioTexto}>Sincronizar</Text>
      </Pressable>

      <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 4 }}>
        Accesos rápidos
      </Text>
      <Text style={{ color: "#64748b" }}>
        Acceda a las funciones más utilizadas del sistema.
      </Text>

      <Link href="/(campo)/historial" asChild>
        <Pressable style={botonPrimario}>
          <Text style={botonPrimarioTexto}>Mis supervisiones</Text>
        </Pressable>
      </Link>
      <Link href="/(campo)/nueva" asChild>
        <Pressable style={botonPrimario}>
          <Text style={botonPrimarioTexto}>Nueva supervisión</Text>
        </Pressable>
      </Link>
      <Pressable
        onPress={() => void exportarPdf()}
        disabled={exportando}
        style={{ ...botonPrimario, opacity: exportando ? 0.6 : 1 }}
      >
        <Text style={botonPrimarioTexto}>
          {exportando ? "Generando PDF..." : "Exportar reporte PDF"}
        </Text>
      </Pressable>
      <Pressable onPress={() => void salir()}>
        <Text style={{ color: color.error, marginTop: 12, fontWeight: "600" }}>
          Cerrar sesión
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Tarjeta({
  titulo,
  valor,
  detalle,
  fondo,
  texto,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  fondo?: string;
  texto?: string;
}) {
  return (
    <View
      style={{
        minWidth: "30%",
        flexGrow: 1,
        ...tarjeta,
        backgroundColor: fondo ?? color.superficie,
        borderColor: color.borde,
      }}
    >
      <Text style={{ color: texto ?? color.textoSuave, fontSize: 12 }}>
        {titulo}
      </Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginTop: 4,
          color: texto ?? color.texto,
        }}
      >
        {valor}
      </Text>
      <Text style={{ color: color.textoSuave, fontSize: 11, marginTop: 4 }}>
        {detalle}
      </Text>
    </View>
  );
}
