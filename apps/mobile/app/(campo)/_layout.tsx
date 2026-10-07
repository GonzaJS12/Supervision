import { Tabs } from "expo-router";
import { color } from "../../src/tema";

export default function CampoLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.superficie },
        headerShadowVisible: false,
        headerTintColor: color.texto,
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        tabBarActiveTintColor: color.primario,
        tabBarInactiveTintColor: color.textoSuave,
        tabBarStyle: {
          backgroundColor: color.superficie,
          borderTopColor: color.borde,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="agentes" options={{ title: "Agentes" }} />
      <Tabs.Screen name="nueva" options={{ title: "Nueva" }} />
      <Tabs.Screen
        name="historial"
        options={{ title: "Mis supervisiones", tabBarLabel: "Historial" }}
      />
      <Tabs.Screen name="pendientes" options={{ title: "Cola" }} />
      <Tabs.Screen
        name="agentes/[id]"
        options={{ href: null, title: "Agente sanitario" }}
      />
      <Tabs.Screen
        name="historial/[id]"
        options={{ href: null, title: "Detalle de supervisión" }}
      />
    </Tabs>
  );
}
