import { Stack } from "expo-router";

export default function CampoLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Campo" }} />
      <Stack.Screen name="agentes" options={{ title: "Agentes" }} />
      <Stack.Screen name="nueva" options={{ title: "Nueva supervisión" }} />
      <Stack.Screen name="pendientes" options={{ title: "Pendientes" }} />
    </Stack>
  );
}
