import { Stack } from "expo-router";
import { color } from "../src/tema";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: "Supervisión APS",
        headerStyle: { backgroundColor: color.superficie },
        headerTintColor: color.texto,
        contentStyle: { backgroundColor: color.fondo },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Ingresar" }} />
      <Stack.Screen name="(campo)" options={{ headerShown: false }} />
    </Stack>
  );
}
