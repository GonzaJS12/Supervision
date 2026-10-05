import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { clienteApi } from "../src/api";
import { guardarSesion } from "../src/auth/storage";
import { pullCatalogos } from "../src/sync/pull";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar() {
    setError("");
    setCargando(true);

    try {
      const { token, usuario } = await clienteApi().login({
        email: email.trim(),
        password,
      });

      if (usuario.rol !== "SUPERVISOR") {
        setError("La app de campo es solo para supervisores.");
        setCargando(false);
        return;
      }

      await guardarSesion(token, usuario);
      try {
        await pullCatalogos();
      } catch {
        setError("No se pudieron cargar los datos del territorio.");
        setCargando(false);
        return;
      }
      router.replace("/(campo)");
    } catch {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Iniciar sesión</Text>
      <Text style={{ color: "#2563eb", fontWeight: "600" }}>Bienvenido</Text>
      <Text style={{ color: "#64748b" }}>
        Ingresá tus credenciales para acceder al sistema de supervisión.
      </Text>
      {error ? (
        <Text style={{ color: "#b91c1c" }}>{error}</Text>
      ) : null}
      <Text>Correo electrónico</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        placeholder="nombre@correo.com"
        value={email}
        onChangeText={setEmail}
        style={campo}
      />
      <Text>Contraseña</Text>
      <View style={{ position: "relative" }}>
        <TextInput
          key={verPassword ? "visible" : "oculta"}
          secureTextEntry={!verPassword}
          placeholder="Ingresá tu contraseña"
          value={password}
          onChangeText={setPassword}
          autoCorrect={false}
          autoCapitalize="none"
          style={{ ...campo, paddingRight: 88 }}
        />
        <Pressable
          onPress={() => setVerPassword((actual) => !actual)}
          style={{ position: "absolute", right: 12, top: 14 }}
        >
          <Text style={{ color: "#2563eb", fontWeight: "600" }}>
            {verPassword ? "Ocultar" : "Mostrar"}
          </Text>
        </Pressable>
      </View>
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
          {cargando ? "Ingresando..." : "Ingresar al sistema"}
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
