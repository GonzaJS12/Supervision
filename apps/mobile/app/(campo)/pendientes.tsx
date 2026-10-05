import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  listarPendientes,
  pushSupervisionesPendientes,
} from "../../src/sync/push";
import { formatearFecha } from "../../src/fechas";
import { etiquetaEstadoPendiente } from "../../src/etiquetas";

export default function PendientesScreen() {
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof listarPendientes>>
  >([]);
  const [mensaje, setMensaje] = useState("");

  const recargar = useCallback(async () => {
    setItems(await listarPendientes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  async function enviar() {
    setMensaje("");
    try {
      const { enviados, errores } = await pushSupervisionesPendientes();
      setMensaje(`Enviadas: ${enviados}. Con error: ${errores}.`);
      await recargar();
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudo enviar.",
      );
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={() => void enviar()}
        style={{
          margin: 16,
          backgroundColor: "#0f172a",
          padding: 14,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Enviar pendientes
        </Text>
      </Pressable>
      {mensaje ? (
        <Text style={{ paddingHorizontal: 16 }}>{mensaje}</Text>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.localId}
        ListEmptyComponent={
          <Text style={{ paddingHorizontal: 16, color: "#64748b" }}>
            No hay supervisiones pendientes de envío.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {etiquetaEstadoPendiente(item.estado)}
            </Text>
            <Text>
              {item.nombreAgente} · {formatearFecha(item.payload.fecha)}
            </Text>
            {item.error ? (
              <Text style={{ color: "#b91c1c" }}>{item.error}</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}
