import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";
import type { Clasificacion } from "@supervision/domain";
import { clienteApi } from "../../src/api";
import { leerUsuario } from "../../src/auth/storage";
import { etiquetasClasificacion } from "../../src/etiquetas";
import {
  enmascararFecha,
  formatearFecha,
  isoDesdeDdMmAaaa,
} from "../../src/fechas";
import {
  compartirPdf,
  htmlListadoSupervisiones,
  type SupervisionPdfListado,
} from "../../src/pdf";

type ItemHistorial = {
  id: number;
  fecha: string;
  promedio: number | string | null;
  clasificacion: Clasificacion | null;
  agenteSanitario: { nombre: string; apellido: string };
};

type RespuestaHistorial = {
  data: ItemHistorial[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

const CLASIFICACIONES: Clasificacion[] = [
  "CRITICO",
  "REGULAR",
  "BUENO",
  "EXCELENTE",
];

export default function HistorialScreen() {
  const [items, setItems] = useState<ItemHistorial[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [clasificacion, setClasificacion] = useState("");
  const [aplicados, setAplicados] = useState({
    desde: "",
    hasta: "",
    clasificacion: "",
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);

  const cargar = useCallback(
    async (pagina: number) => {
      setCargando(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", String(pagina));
      params.set("limit", "15");
      const isoDesde = isoDesdeDdMmAaaa(aplicados.desde);
      const isoHasta = isoDesdeDdMmAaaa(aplicados.hasta);
      if (isoDesde) {
        params.set("fechaDesde", isoDesde);
      }
      if (isoHasta) {
        params.set("fechaHasta", isoHasta);
      }
      if (aplicados.clasificacion) {
        params.set("clasificacion", aplicados.clasificacion);
      }

      try {
        const datos = (await clienteApi().misSupervisiones(
          `?${params.toString()}`,
        )) as RespuestaHistorial;
        setItems(datos.data ?? []);
        setMeta({
          page: datos.meta?.page ?? pagina,
          totalPages: datos.meta?.totalPages ?? 0,
          total: datos.meta?.total ?? 0,
        });
        setPage(datos.meta?.page ?? pagina);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el historial.",
        );
      } finally {
        setCargando(false);
      }
    },
    [aplicados],
  );

  useFocusEffect(
    useCallback(() => {
      void cargar(1);
    }, [cargar]),
  );

  async function exportarPdf() {
    setError("");
    setExportando(true);
    try {
      const usuario = await leerUsuario();
      const datos = (await clienteApi().exportacion()) as SupervisionPdfListado[];
      if (!Array.isArray(datos) || datos.length === 0) {
        setError("No tiene supervisiones para exportar.");
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo generar el PDF.",
      );
    } finally {
      setExportando(false);
    }
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={items}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 12 }}>
          <Text style={{ fontWeight: "600" }}>Filtros</Text>
          <TextInput
            placeholder="Desde (dd/mm/aaaa)"
            value={desde}
            onChangeText={(valor) => setDesde(enmascararFecha(valor))}
            keyboardType="number-pad"
            style={campo}
          />
          <TextInput
            placeholder="Hasta (dd/mm/aaaa)"
            value={hasta}
            onChangeText={(valor) => setHasta(enmascararFecha(valor))}
            keyboardType="number-pad"
            style={campo}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pressable
              onPress={() => setClasificacion("")}
              style={chip(clasificacion === "")}
            >
              <Text>Todas</Text>
            </Pressable>
            {CLASIFICACIONES.map((clave) => (
              <Pressable
                key={clave}
                onPress={() => setClasificacion(clave)}
                style={chip(clasificacion === clave)}
              >
                <Text>{etiquetasClasificacion[clave]}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() =>
              setAplicados({ desde, hasta, clasificacion })
            }
            style={{
              backgroundColor: "#0f172a",
              padding: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Aplicar filtros
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void exportarPdf()}
            disabled={exportando}
            style={{
              backgroundColor: "#0f172a",
              padding: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              {exportando ? "Generando PDF..." : "Exportar reporte PDF"}
            </Text>
          </Pressable>
          {error ? (
            <Text style={{ color: "#b91c1c" }}>{error}</Text>
          ) : null}
          {cargando ? (
            <Text style={{ color: "#64748b" }}>Cargando...</Text>
          ) : (
            <Text style={{ color: "#64748b" }}>
              {meta.total}{" "}
              {meta.total === 1 ? "supervisión" : "supervisiones"}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        cargando ? null : (
          <>
            <Text style={{ fontWeight: "600" }}>
              Todavía no realizó supervisiones
            </Text>
            <Text>
              Cuando realice una supervisión, podrá consultarla desde esta
              pantalla.
            </Text>
          </>
        )
      }
      ListFooterComponent={
        meta.totalPages > 1 ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <Pressable
              disabled={page <= 1}
              onPress={() => void cargar(page - 1)}
            >
              <Text style={{ color: page <= 1 ? "#94a3b8" : "#0f172a" }}>
                Anterior
              </Text>
            </Pressable>
            <Text>
              {page} / {meta.totalPages}
            </Text>
            <Pressable
              disabled={page >= meta.totalPages}
              onPress={() => void cargar(page + 1)}
            >
              <Text
                style={{
                  color: page >= meta.totalPages ? "#94a3b8" : "#0f172a",
                }}
              >
                Siguiente
              </Text>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Link href={`/(campo)/historial/${item.id}`} asChild>
          <Pressable
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {item.agenteSanitario.apellido}, {item.agenteSanitario.nombre}
            </Text>
            <Text style={{ color: "#64748b" }}>
              {formatearFecha(item.fecha)}
              {item.promedio != null
                ? ` · ${Number(item.promedio).toFixed(2)}`
                : ""}
              {item.clasificacion
                ? ` · ${etiquetasClasificacion[item.clasificacion] ?? item.clasificacion}`
                : ""}
            </Text>
          </Pressable>
        </Link>
      )}
    />
  );
}

const campo = {
  borderWidth: 1,
  borderColor: "#cbd5e1",
  borderRadius: 8,
  padding: 10,
};

function chip(activo: boolean) {
  return {
    borderWidth: 1,
    borderColor: activo ? "#0f172a" : "#cbd5e1",
    backgroundColor: activo ? "#e2e8f0" : "white",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  };
}
