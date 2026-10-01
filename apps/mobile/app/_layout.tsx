import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerTitle: "Supervisión APS" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Ingresar" }} />
      <Stack.Screen name="(campo)" options={{ headerShown: false }} />
    </Stack>
  );
}
