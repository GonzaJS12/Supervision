import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { color } from "./tema";

type PropsBarra = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const PESTANAS = ["index", "agentes", "nueva", "historial", "pendientes"] as const;

const iconos = {
  index: { activo: "home", inactivo: "home-outline" },
  agentes: { activo: "people", inactivo: "people-outline" },
  nueva: { activo: "add-circle", inactivo: "add-circle-outline" },
  historial: { activo: "reader", inactivo: "reader-outline" },
  pendientes: { activo: "cloud-upload", inactivo: "cloud-upload-outline" },
} as const;

const etiquetas: Record<(typeof PESTANAS)[number], string> = {
  index: "Inicio",
  agentes: "Agentes",
  nueva: "Nueva",
  historial: "Historial",
  pendientes: "Cola",
};

function esPestaña(nombre: string): nombre is (typeof PESTANAS)[number] {
  return (PESTANAS as readonly string[]).includes(nombre);
}

export function BarraTabs({ state, descriptors, navigation, insets }: PropsBarra) {
  const paddingInferior = Math.max(insets.bottom, 10);

  return (
    <View
      style={[estilos.envoltorio, { paddingBottom: paddingInferior }]}
      accessibilityRole="tablist"
    >
      <View style={estilos.fila}>
        {state.routes.map((ruta, indice) => {
          if (!esPestaña(ruta.name)) {
            return null;
          }

          const enfocada = state.index === indice;
          const opciones = descriptors[ruta.key]?.options;
          const etiqueta =
            (typeof opciones?.tabBarLabel === "string" && opciones.tabBarLabel) ||
            opciones?.title ||
            etiquetas[ruta.name];
          const par = iconos[ruta.name];
          const tono = enfocada ? color.primario : color.textoSuave;

          return (
            <Pressable
              key={ruta.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: enfocada }}
              accessibilityLabel={opciones?.tabBarAccessibilityLabel ?? etiqueta}
              android_ripple={{ color: color.primarioSuave, borderless: true }}
              onPress={() => {
                const evento = navigation.emit({
                  type: "tabPress",
                  target: ruta.key,
                  canPreventDefault: true,
                });

                if (!enfocada && !evento.defaultPrevented) {
                  navigation.navigate(ruta.name, ruta.params);
                }
              }}
              onLongPress={() => {
                navigation.emit({
                  type: "tabLongPress",
                  target: ruta.key,
                });
              }}
              style={({ pressed }) => [
                estilos.item,
                enfocada ? estilos.itemActivo : null,
                pressed ? estilos.itemPresionado : null,
              ]}
            >
              <Ionicons
                name={enfocada ? par.activo : par.inactivo}
                size={ruta.name === "nueva" ? 26 : 23}
                color={tono}
              />
              <View
                style={[
                  estilos.indicador,
                  { backgroundColor: enfocada ? color.primario : "transparent" },
                ]}
              />
              <Text
                numberOfLines={1}
                style={[estilos.etiqueta, { color: tono }]}
              >
                {etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  envoltorio: {
    backgroundColor: color.superficie,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.borde,
    paddingTop: 8,
    paddingHorizontal: 6,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 16,
  },
  fila: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    minHeight: 56,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 16,
    minHeight: 48,
  },
  itemActivo: {
    backgroundColor: color.primarioSuave,
  },
  itemPresionado: {
    transform: [{ scale: 0.94 }],
    opacity: 0.88,
  },
  indicador: {
    width: 14,
    height: 3,
    borderRadius: 99,
    marginTop: 4,
    marginBottom: 2,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
