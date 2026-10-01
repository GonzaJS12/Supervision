import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { clienteApi } from "../src/api";
import { API_URL } from "../src/config";
import { guardarSesion } from "../src/auth/storage";
import { pullCatalogos } from "../src/sync/pull";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar() {
    setError("");
    setCargando(true);

    try {
      const { token, usuario } = await clienteApi().login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (usuario.rol !== "SUPERVISOR") {
        setError("La app de campo es solo para supervisores.");
        setCargando(false);
        return;
      }

      await guardarSesion(token, usuario);
      await pullCatalogos();
      router.replace("/(campo)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo ingresar");
      setCargando(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Ingresar</Text>
      <Text style={{ color: "#64748b" }}>API: {API_URL}</Text>
      {error ? (
        <Text style={{ color: "#b91c1c" }}>{error}</Text>
      ) : null}
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={campo}
      />
      <TextInput
        secureTextEntry
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        style={campo}
      />
      <Pressable
        onPress={() => void ingresar()}
        disabled={cargando}
        style={{
          backgroundColor: "#0f172a",
          padding: 14,
          borderRadius: 8,
          opacity: cargando ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          {cargando ? "Ingresando..." : "Entrar y sincronizar catálogo"}
        </Text>
      </Pressable>
    </View>
  );
}

const campo = {
  borderWidth: 1,
  borderColor: "#cbd5e1",
  borderRadius: 8,
  padding: 12,
};
