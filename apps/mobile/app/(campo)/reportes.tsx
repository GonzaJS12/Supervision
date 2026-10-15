import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { formatearFechaHora } from "../../src/fechas";
import {
  abrirPdfLocal,
  eliminarReporteGuardado,
  listarReportesGuardados,
} from "../../src/pdf";
import type { ReportePdfLocal } from "../../src/db/consultas";
import { color, tarjeta } from "../../src/tema";

export default function ReportesScreen() {
  const [items, setItems] = useState<ReportePdfLocal[]>([]);
  const [error, setError] = useState("");
  const [abriendo, setAbriendo] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      setItems(await listarReportesGuardados());
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los reportes.",
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function abrir(item: ReportePdfLocal) {
    setAbriendo(item.id);
    setError("");
    try {
      await abrirPdfLocal(item.uri);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo abrir el reporte.",
      );
    } finally {
      setAbriendo(null);
    }
  }

  function confirmarBorrar(item: ReportePdfLocal) {
    Alert.alert(
      "Eliminar reporte",
      `¿Quiere borrar "${item.titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await eliminarReporteGuardado(item.id, item.uri);
                await cargar();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "No se pudo eliminar el reporte.",
                );
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10 }}
      data={items}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={{ gap: 8, marginBottom: 8 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: color.primario }}>Volver</Text>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: color.texto }}>
            Mis reportes
          </Text>
          <Text style={{ color: color.textoSuave, lineHeight: 20 }}>
            Acá quedan los PDF que guardó en el dispositivo. Toque uno para
            abrirlo.
          </Text>
          {error ? (
            <Text style={{ color: color.error }}>{error}</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <Text style={{ color: color.textoMedio }}>
          Todavía no guardó reportes. Use “Reporte PDF en el Dispositivo” y
          van a aparecer aquí.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={{ ...tarjeta, gap: 8 }}>
          <Pressable
            onPress={() => void abrir(item)}
            disabled={abriendo != null}
            style={{ opacity: abriendo === item.id ? 0.6 : 1 }}
          >
            <Text style={{ fontWeight: "700", color: color.texto }}>
              {item.titulo}
            </Text>
            <Text style={{ color: color.textoSuave, marginTop: 4 }}>
              {formatearFechaHora(item.createdAt)}
            </Text>
            <Text style={{ color: color.primario, marginTop: 8, fontWeight: "600" }}>
              {abriendo === item.id ? "Abriendo..." : "Abrir PDF"}
            </Text>
          </Pressable>
          <Pressable onPress={() => confirmarBorrar(item)}>
            <Text style={{ color: color.error, fontWeight: "600" }}>
              Eliminar
            </Text>
          </Pressable>
        </View>
      )}
    />
  );
}
