import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { listarAgentesLocales } from "../../src/db/consultas";

export default function AgentesLocalesScreen() {
  const [agentes, setAgentes] = useState<
    Awaited<ReturnType<typeof listarAgentesLocales>>
  >([]);

  useFocusEffect(
    useCallback(() => {
      void listarAgentesLocales().then(setAgentes);
    }, []),
  );

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={agentes}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={
        <Text>No hay agentes. Sincronizá el catálogo.</Text>
      }
      renderItem={({ item }) => (
        <View
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
        </View>
      )}
    />
  );
}
