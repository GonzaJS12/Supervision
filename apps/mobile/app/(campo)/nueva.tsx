import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  calcularClasificacion,
  calcularPromedio,
  type DecisionGestion,
} from "@supervision/domain";
import { leerUsuario } from "../../src/auth/storage";
import {
  listarAgentesLocales,
  listarBloquesLocales,
  listarRondasLocales,
} from "../../src/db/consultas";
import {
  guardarPendiente,
  pushSupervisionesPendientes,
} from "../../src/sync/push";

const decisiones: DecisionGestion[] = [
  "NO_REQUIERE",
  "SEGUIMIENTO",
  "CAPACITACION",
  "SUPERVISION_INTENSIVA",
];

export default function NuevaLocalScreen() {
  const [agentes, setAgentes] = useState<
    Awaited<ReturnType<typeof listarAgentesLocales>>
  >([]);
  const [rondas, setRondas] = useState<
    Awaited<ReturnType<typeof listarRondasLocales>>
  >([]);
  const [bloques, setBloques] = useState<
    Awaited<ReturnType<typeof listarBloquesLocales>>
  >([]);
  const [agenteId, setAgenteId] = useState<number | null>(null);
  const [rondaId, setRondaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [familiaNumero, setFamiliaNumero] = useState("");
  const [decision, setDecision] =
    useState<DecisionGestion>("NO_REQUIERE");
  const [puntuaciones, setPuntuaciones] = useState<Record<number, number>>(
    {},
  );
  const [fortalezas, setFortalezas] = useState("");
  const [oportunidadesMejora, setOportunidadesMejora] = useState("");
  const [situacionesCriticas, setSituacionesCriticas] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [a, r, b] = await Promise.all([
          listarAgentesLocales(),
          listarRondasLocales(),
          listarBloquesLocales(),
        ]);
        setAgentes(a);
        setRondas(r);
        setBloques(b);
        setRondaId(r[0]?.id ?? null);
      })();
    }, []),
  );

  const criterios = bloques.flatMap((bloque) => bloque.criterios);
  const valores = criterios
    .map((criterio) => puntuaciones[criterio.id])
    .filter((valor): valor is number => valor != null);
  const promedio =
    valores.length === criterios.length && criterios.length > 0
      ? calcularPromedio(valores)
      : null;

  async function guardar() {
    setError("");
    const usuario = await leerUsuario();
    const agente = agentes.find((item) => item.id === agenteId);

    if (!usuario?.areaOperativaId || !agente || !rondaId) {
      setError("Falta agente, ronda o área del supervisor.");
      return;
    }

    if (valores.length !== criterios.length) {
      setError("Hay que puntuar todos los criterios.");
      return;
    }

    setGuardando(true);
    const localId = `local-${Date.now()}`;

    await guardarPendiente({
      localId,
      agenteSanitarioId: agente.id,
      areaOperativaId: usuario.areaOperativaId,
      sectorId: agente.sector_id,
      rondaId,
      fecha,
      familiaNumero: familiaNumero ? Number(familiaNumero) : null,
      decisionGestion: decision,
      fortalezas,
      oportunidadesMejora,
      situacionesCriticas,
      recomendaciones,
      evaluaciones: criterios.map((criterio) => ({
        criterioId: criterio.id,
        puntuacion: puntuaciones[criterio.id],
      })),
    });

    try {
      await pushSupervisionesPendientes();
    } catch {
      /*
       * Queda en cola local.
       */
    }

    setGuardando(false);
    router.replace("/(campo)/pendientes");
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}

      <Text style={{ fontWeight: "600" }}>Agente</Text>
      {agentes.map((agente) => (
        <Pressable
          key={agente.id}
          onPress={() => setAgenteId(agente.id)}
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: agenteId === agente.id ? "#0f172a" : "#cbd5e1",
            borderRadius: 8,
          }}
        >
          <Text>
            {agente.apellido}, {agente.nombre}
          </Text>
        </Pressable>
      ))}

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Ronda</Text>
      {rondas.map((ronda) => (
        <Pressable
          key={ronda.id}
          onPress={() => setRondaId(ronda.id)}
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: rondaId === ronda.id ? "#0f172a" : "#cbd5e1",
            borderRadius: 8,
          }}
        >
          <Text>{ronda.nombre}</Text>
        </Pressable>
      ))}

      <Text>Fecha (AAAA-MM-DD)</Text>
      <TextInput value={fecha} onChangeText={setFecha} style={campo} />
      <Text>Familia N°</Text>
      <TextInput
        keyboardType="number-pad"
        value={familiaNumero}
        onChangeText={setFamiliaNumero}
        style={campo}
      />

      {bloques.map((bloque) => (
        <View key={bloque.id} style={{ gap: 8 }}>
          <Text style={{ fontWeight: "600" }}>{bloque.nombre}</Text>
          {bloque.criterios.map((criterio) => (
            <View key={criterio.id}>
              <Text>{criterio.nombre}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                {[1, 2, 3, 4, 5].map((valor) => (
                  <Pressable
                    key={valor}
                    onPress={() =>
                      setPuntuaciones((actual) => ({
                        ...actual,
                        [criterio.id]: valor,
                      }))
                    }
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        puntuaciones[criterio.id] === valor
                          ? "#0f172a"
                          : "#e2e8f0",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          puntuaciones[criterio.id] === valor
                            ? "white"
                            : "#0f172a",
                      }}
                    >
                      {valor}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}

      {promedio != null && (
        <Text>
          Promedio {promedio.toFixed(2)} · {calcularClasificacion(promedio)}
        </Text>
      )}

      <Text style={{ fontWeight: "600" }}>Decisión de gestión</Text>
      {decisiones.map((item) => (
        <Pressable key={item} onPress={() => setDecision(item)}>
          <Text style={{ fontWeight: decision === item ? "700" : "400" }}>
            {item}
          </Text>
        </Pressable>
      ))}

      <TextInput
        placeholder="Fortalezas"
        value={fortalezas}
        onChangeText={setFortalezas}
        multiline
        style={[campo, { minHeight: 80 }]}
      />
      <TextInput
        placeholder="Oportunidades de mejora"
        value={oportunidadesMejora}
        onChangeText={setOportunidadesMejora}
        multiline
        style={[campo, { minHeight: 80 }]}
      />
      <TextInput
        placeholder="Situaciones críticas"
        value={situacionesCriticas}
        onChangeText={setSituacionesCriticas}
        multiline
        style={[campo, { minHeight: 80 }]}
      />
      <TextInput
        placeholder="Recomendaciones"
        value={recomendaciones}
        onChangeText={setRecomendaciones}
        multiline
        style={[campo, { minHeight: 80 }]}
      />

      <Pressable
        onPress={() => void guardar()}
        disabled={guardando}
        style={{
          backgroundColor: "#0f172a",
          padding: 14,
          borderRadius: 8,
          opacity: guardando ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          {guardando ? "Guardando..." : "Guardar (offline) y intentar envío"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const campo = {
  borderWidth: 1,
  borderColor: "#cbd5e1",
  borderRadius: 8,
  padding: 12,
};
