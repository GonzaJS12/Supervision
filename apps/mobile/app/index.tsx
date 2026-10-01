import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { leerToken } from "../src/auth/storage";
import { obtenerDb } from "../src/db/database";

export default function IndexScreen() {
  useEffect(() => {
    const iniciar = async () => {
      await obtenerDb();
      const token = await leerToken();
      router.replace(token ? "/(campo)" : "/login");
    };

    void iniciar();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
