import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { listarAgentesLocales } from "../../src/db/consultas";

const LIMITE_POR_PAGINA = 10;

type AgenteLocal = Awaited<ReturnType<typeof listarAgentesLocales>>[number];

export default function AgentesLocalesScreen() {
  const [agentes, setAgentes] = useState<AgenteLocal[]>([]);
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  useFocusEffect(
    useCallback(() => {
      void listarAgentesLocales().then(setAgentes);
    }, []),
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusqueda(nombre.trim());
      setPagina(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [nombre]);

  const filtrados = useMemo(() => {
    const termino = busqueda.toLowerCase();
    if (!termino) {
      return agentes;
    }

    return agentes.filter((agente) => {
      const completo = `${agente.apellido} ${agente.nombre}`.toLowerCase();
      return completo.includes(termino);
    });
  }, [agentes, busqueda]);

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const desde = total === 0 ? 0 : (paginaActual - 1) * LIMITE_POR_PAGINA;
  const paginaAgentes = filtrados.slice(desde, desde + LIMITE_POR_PAGINA);
  const hasta = Math.min(desde + LIMITE_POR_PAGINA, total);

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      data={paginaAgentes}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 8 }}>
          <Text style={{ fontWeight: "600", fontSize: 16 }}>
            Agentes sanitarios
          </Text>
          <Text style={{ color: "#64748b" }}>
            Consulte los agentes sanitarios pertenecientes a su área operativa.
          </Text>
          <Text>Agente</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre o apellido"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 8,
              padding: 12,
            }}
          />
          <Text style={{ color: "#64748b" }}>
            {total} {total === 1 ? "agente" : "agentes"}
            {total > 0 ? ` · ${desde + 1}–${hasta}` : ""}
          </Text>
        </View>
      }
      ListEmptyComponent={
        busqueda ? (
          <Text>No se encontraron agentes.</Text>
        ) : (
          <>
            <Text style={{ fontWeight: "600" }}>No hay agentes registrados</Text>
            <Text>
              Actualmente no existen agentes sanitarios disponibles.
            </Text>
          </>
        )
      }
      ListFooterComponent={
        total > 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
              gap: 8,
            }}
          >
            <Pressable
              onPress={() => setPagina((actual) => Math.max(1, actual - 1))}
              disabled={paginaActual <= 1}
              style={{
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                opacity: paginaActual <= 1 ? 0.4 : 1,
              }}
            >
              <Text>Anterior</Text>
            </Pressable>
            <Text>
              Página {paginaActual} de {totalPaginas}
            </Text>
            <Pressable
              onPress={() =>
                setPagina((actual) => Math.min(totalPaginas, actual + 1))
              }
              disabled={paginaActual >= totalPaginas}
              style={{
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                opacity: paginaActual >= totalPaginas ? 0.4 : 1,
              }}
            >
              <Text>Siguiente</Text>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/(campo)/agentes/${item.id}`)}
          style={{
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: "#e2e8f0",
          }}
        >
          <Text style={{ fontWeight: "600" }}>
            {item.apellido}, {item.nombre}
          </Text>
          {item.cobertura ? (
            <Text style={{ color: "#64748b" }}>{item.cobertura}</Text>
          ) : null}
        </Pressable>
      )}
    />
  );
}
