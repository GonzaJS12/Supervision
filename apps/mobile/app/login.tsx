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
import {
  botonPrimario,
  botonPrimarioTexto,
  campo,
  color,
} from "../src/tema";

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
    <View
      style={{
        flex: 1,
        padding: 24,
        gap: 12,
        justifyContent: "center",
        backgroundColor: color.fondo,
      }}
    >
      <Text
        style={{
          color: color.primario,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        Salud pública
      </Text>
      <Text style={{ fontSize: 26, fontWeight: "700", color: color.texto }}>
        Iniciar sesión
      </Text>
      <Text style={{ color: color.textoSuave, lineHeight: 22 }}>
        Ingresá tus credenciales para acceder al sistema de supervisión.
      </Text>
      {error ? (
        <View
          style={{
            backgroundColor: color.errorSuave,
            borderColor: "#fecaca",
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text style={{ color: color.error }}>{error}</Text>
        </View>
      ) : null}
      <Text style={{ fontWeight: "600", color: color.texto, marginTop: 8 }}>
        Correo electrónico
      </Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        placeholder="nombre@correo.com"
        placeholderTextColor={color.textoSuave}
        value={email}
        onChangeText={setEmail}
        style={campo}
      />
      <Text style={{ fontWeight: "600", color: color.texto }}>Contraseña</Text>
      <View style={{ position: "relative" }}>
        <TextInput
          key={verPassword ? "visible" : "oculta"}
          secureTextEntry={!verPassword}
          placeholder="Ingresá tu contraseña"
          placeholderTextColor={color.textoSuave}
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
          <Text style={{ color: color.primario, fontWeight: "600" }}>
            {verPassword ? "Ocultar" : "Mostrar"}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => void ingresar()}
        disabled={cargando}
        style={{ ...botonPrimario, opacity: cargando ? 0.6 : 1, marginTop: 8 }}
      >
        <Text style={botonPrimarioTexto}>
          {cargando ? "Ingresando..." : "Ingresar al sistema"}
        </Text>
      </Pressable>
    </View>
  );
}
