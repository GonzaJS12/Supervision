import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  buscarAgenteLocal,
  listarSectoresLocales,
  listarSupervisionesPorAgenteLocal,
} from "../../../src/db/consultas";
import { formatearFecha } from "../../../src/fechas";
import { etiquetasClasificacion } from "../../../src/etiquetas";

export default function DetalleAgenteLocalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [error, setError] = useState("");
  const [agente, setAgente] = useState<
    Awaited<ReturnType<typeof buscarAgenteLocal>>
  >(null);
  const [sectorNombre, setSectorNombre] = useState("Sin sector asignado");
  const [supervisiones, setSupervisiones] = useState<
    Awaited<ReturnType<typeof listarSupervisionesPorAgenteLocal>>
  >([]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (!id || !/^\d+$/.test(id)) {
          setError("No se indicó un agente.");
          return;
        }

        try {
          const datos = await buscarAgenteLocal(Number(id));
          if (!datos) {
            setError("No se pudo cargar la información del agente.");
            return;
          }
          setAgente(datos);
          const sectores = await listarSectoresLocales();
          const sector = sectores.find((item) => item.id === datos.sector_id);
          setSectorNombre(
            sector
              ? sector.nombre || `Sector ${sector.numero}`
              : "Sin sector asignado",
          );
          setSupervisiones(await listarSupervisionesPorAgenteLocal(datos.id));
        } catch {
          setError("No se pudo cargar la información del agente.");
        }
      })();
    }, [id]),
  );

  if (error || !agente) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Pressable onPress={() => router.replace("/(campo)/agentes")}>
          <Text>Volver a agentes</Text>
        </Pressable>
        <Text style={{ fontWeight: "600" }}>No se pudo mostrar el agente</Text>
        <Text>{error || "No se encontró el agente."}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Pressable onPress={() => router.replace("/(campo)/agentes")}>
        <Text>Volver a agentes</Text>
      </Pressable>
      <Text style={{ color: "#2563eb", fontSize: 12, fontWeight: "600" }}>
        Agente sanitario
      </Text>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>
        {agente.apellido}, {agente.nombre}
      </Text>
      <Text style={{ color: "#64748b" }}>
        Información territorial e historial de supervisiones
      </Text>
      <Text style={{ fontWeight: "600", marginTop: 8 }}>
        Información del agente
      </Text>
      <Text style={{ color: "#64748b", fontSize: 12 }}>
        Datos obtenidos del sistema territorial.
      </Text>
      <Text>Nombre: {agente.nombre}</Text>
      <Text>Apellido: {agente.apellido}</Text>
      <Text>Sector: {sectorNombre}</Text>
      <Text>Cobertura: {agente.cobertura ?? "No informada"}</Text>

      <Pressable
        onPress={() =>
          router.push(`/(campo)/nueva?agenteId=${agente.id}`)
        }
        style={{
          backgroundColor: "#2563eb",
          padding: 14,
          borderRadius: 8,
          marginTop: 8,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
          Realizar supervisión
        </Text>
      </Pressable>

      <Text style={{ fontWeight: "600", marginTop: 12 }}>
        Mis supervisiones a este agente
      </Text>
      <Text style={{ color: "#64748b" }}>
        Supervisiones que usted ha realizado a este agente.{" "}
        {supervisiones.length}{" "}
        {supervisiones.length === 1 ? "supervisión" : "supervisiones"}
      </Text>
      {supervisiones.length === 0 ? (
        <>
          <Text style={{ fontWeight: "600" }}>Sin supervisiones</Text>
          <Text>
            Usted todavía no ha realizado supervisiones a este agente.
          </Text>
        </>
      ) : (
        supervisiones.map((item) => (
          <View
            key={item.id}
            style={{
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              Supervisión del {formatearFecha(item.fecha)}
            </Text>
            <Text>
              Promedio{" "}
              {item.promedio == null
                ? "—"
                : Number(item.promedio).toFixed(2)}
              {item.clasificacion
                ? ` · ${etiquetasClasificacion[item.clasificacion] ?? item.clasificacion}`
                : " · Sin clasificación"}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
