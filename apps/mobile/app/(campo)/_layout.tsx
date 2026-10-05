import { Stack } from "expo-router";

export default function CampoLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Inicio" }} />
      <Stack.Screen name="agentes" options={{ title: "Agentes" }} />
      <Stack.Screen name="agentes/[id]" options={{ title: "Agente sanitario" }} />
      <Stack.Screen name="nueva" options={{ title: "Nueva supervisión" }} />
      <Stack.Screen name="pendientes" options={{ title: "Pendientes" }} />
      <Stack.Screen name="historial" options={{ title: "Mis supervisiones" }} />
      <Stack.Screen
        name="historial/[id]"
        options={{ title: "Detalle de supervisión" }}
      />
    </Stack>
  );
}
