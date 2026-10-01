import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import { borrarSesion, leerUsuario } from "../../src/auth/storage";
import { leerMeta } from "../../src/db/consultas";
import { pullCatalogos } from "../../src/sync/pull";
import { listarPendientes, pushSupervisionesPendientes } from "../../src/sync/push";

export default function CampoHome() {
  const [nombre, setNombre] = useState("");
  const [pulledAt, setPulledAt] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState(0);
  const [mensaje, setMensaje] = useState("");

  const recargar = useCallback(async () => {
    const usuario = await leerUsuario();
    setNombre(
      usuario ? `${usuario.nombre} ${usuario.apellido}` : "",
    );
    setPulledAt(await leerMeta("pulledAt"));
    const lista = await listarPendientes();
    setPendientes(
      lista.filter((item) => item.estado !== "sincronizada").length,
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  async function sincronizar() {
    setMensaje("");
    try {
      await pullCatalogos();
      const { enviados, errores } = await pushSupervisionesPendientes();
      setMensaje(
        `Catálogo actualizado. Enviadas: ${enviados}. Con error: ${errores}.`,
      );
      await recargar();
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudo sincronizar",
      );
    }
  }

  async function salir() {
    await borrarSesion();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Campo</Text>
      <Text>{nombre}</Text>
      <Text style={{ color: "#64748b" }}>
        Último pull: {pulledAt ?? "nunca"}
      </Text>
      <Text>Pendientes de envío: {pendientes}</Text>
      {mensaje ? <Text>{mensaje}</Text> : null}

      <Pressable
        onPress={() => void sincronizar()}
        style={boton}
      >
        <Text style={botonTexto}>Sincronizar</Text>
      </Pressable>

      <Link href="/(campo)/nueva" asChild>
        <Pressable style={boton}>
          <Text style={botonTexto}>Nueva supervisión</Text>
        </Pressable>
      </Link>
      <Link href="/(campo)/agentes" asChild>
        <Pressable style={botonSec}>
          <Text>Agentes locales</Text>
        </Pressable>
      </Link>
      <Link href="/(campo)/pendientes" asChild>
        <Pressable style={botonSec}>
          <Text>Cola de envío</Text>
        </Pressable>
      </Link>
      <Pressable onPress={() => void salir()}>
        <Text style={{ color: "#b91c1c", marginTop: 12 }}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const boton = {
  backgroundColor: "#0f172a",
  padding: 14,
  borderRadius: 8,
};
const botonTexto = { color: "white", textAlign: "center" as const };
const botonSec = {
  borderWidth: 1,
  borderColor: "#cbd5e1",
  padding: 14,
  borderRadius: 8,
};
