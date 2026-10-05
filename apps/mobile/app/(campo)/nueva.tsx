import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
  listarSectoresLocales,
} from "../../src/db/consultas";
import {
  guardarPendiente,
  pushSupervisionesPendientes,
} from "../../src/sync/push";
import {
  enmascararFecha,
  hoyEnDdMmAaaa,
  isoDesdeDdMmAaaa,
} from "../../src/fechas";
import {
  ayudasGestion,
  etiquetasClasificacion,
  etiquetasGestion,
} from "../../src/etiquetas";

function nombreSector(sector: { nombre: string | null }) {
  const nombre = sector.nombre?.trim();
  return nombre || "Sin nombre";
}

function Desplegable({
  titulo,
  placeholder,
  valor,
  opciones,
  onChange,
  deshabilitado,
}: {
  titulo: string;
  placeholder: string;
  valor: string;
  opciones: Array<{ valor: string; etiqueta: string }>;
  onChange: (valor: string) => void;
  deshabilitado?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const elegido = opciones.find((item) => item.valor === valor);

  return (
    <View>
      <Text style={{ fontWeight: "600" }}>{titulo}</Text>
      <Pressable
        disabled={deshabilitado}
        onPress={() => setAbierto((actual) => !actual)}
        style={{ ...campo, opacity: deshabilitado ? 0.5 : 1 }}
      >
        <Text style={{ color: elegido ? "#0f172a" : "#64748b" }}>
          {elegido?.etiqueta ?? placeholder}
        </Text>
      </Pressable>
      {abierto && !deshabilitado
        ? opciones.map((item) => (
            <Pressable
              key={item.valor}
              onPress={() => {
                onChange(item.valor);
                setAbierto(false);
              }}
              style={{
                padding: 10,
                borderBottomWidth: 1,
                borderColor: "#e2e8f0",
                backgroundColor: item.valor === valor ? "#eff6ff" : "white",
              }}
            >
              <Text>{item.etiqueta}</Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}

const decisiones: DecisionGestion[] = [
  "NO_REQUIERE",
  "SEGUIMIENTO",
  "CAPACITACION",
  "SUPERVISION_INTENSIVA",
];

export default function NuevaLocalScreen() {
  const { agenteId: agenteParam } = useLocalSearchParams<{
    agenteId?: string;
  }>();
  const [agentes, setAgentes] = useState<
    Awaited<ReturnType<typeof listarAgentesLocales>>
  >([]);
  const [sectores, setSectores] = useState<
    Awaited<ReturnType<typeof listarSectoresLocales>>
  >([]);
  const [rondas, setRondas] = useState<
    Awaited<ReturnType<typeof listarRondasLocales>>
  >([]);
  const [bloques, setBloques] = useState<
    Awaited<ReturnType<typeof listarBloquesLocales>>
  >([]);
  const [sectorFiltro, setSectorFiltro] = useState<number | null>(null);
  const [agenteId, setAgenteId] = useState<number | null>(
    agenteParam ? Number(agenteParam) : null,
  );
  const [rondaId, setRondaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(hoyEnDdMmAaaa());
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
        const [a, r, b, s] = await Promise.all([
          listarAgentesLocales(),
          listarRondasLocales(),
          listarBloquesLocales(),
          listarSectoresLocales(),
        ]);
        setAgentes(a);
        setRondas(r);
        setBloques(b);
        setSectores(s);
        if (agenteParam) {
          const pre = a.find((item) => item.id === Number(agenteParam));
          if (pre) {
            setAgenteId(pre.id);
            setSectorFiltro(pre.sector_id);
          }
        }
      })();
    }, [agenteParam]),
  );

  const criterios = bloques.flatMap((bloque) => bloque.criterios);
  const agentesFiltrados =
    sectorFiltro == null
      ? agentes
      : sectorFiltro === 0
        ? agentes.filter((agente) => agente.sector_id == null)
        : agentes.filter((agente) => agente.sector_id === sectorFiltro);
  const valores = criterios
    .map((criterio) => puntuaciones[criterio.id])
    .filter((valor): valor is number => valor != null);
  const promedio =
    valores.length === criterios.length && criterios.length > 0
      ? calcularPromedio(valores)
      : null;
  const progreso =
    criterios.length === 0
      ? 0
      : Math.round((valores.length / criterios.length) * 100);

  async function guardar() {
    setError("");
    const usuario = await leerUsuario();
    const agente = agentes.find((item) => item.id === agenteId);

    if (!agente) {
      setError("Debe seleccionar un agente sanitario.");
      return;
    }

    if (!rondaId) {
      setError("Debe seleccionar una ronda.");
      return;
    }

    const fechaIso = isoDesdeDdMmAaaa(fecha);
    if (!fechaIso) {
      setError("La fecha debe tener el formato dd/mm/aaaa.");
      return;
    }

    if (!usuario?.areaOperativaId) {
      setError("El supervisor no tiene un área operativa asignada");
      return;
    }

    if (valores.length !== criterios.length) {
      setError("Debe puntuar todos los criterios de evaluación.");
      return;
    }

    setGuardando(true);
    const localId = `local-${Date.now()}`;

    try {
      await guardarPendiente({
        localId,
        agenteSanitarioId: agente.id,
        areaOperativaId: usuario.areaOperativaId,
        sectorId: agente.sector_id ?? undefined,
        rondaId,
        fecha: new Date(`${fechaIso}T12:00:00`).toISOString(),
        familiaNumero: familiaNumero ? Number(familiaNumero) : undefined,
        decisionGestion: decision,
        fortalezas: fortalezas || undefined,
        oportunidadesMejora: oportunidadesMejora || undefined,
        situacionesCriticas: situacionesCriticas || undefined,
        recomendaciones: recomendaciones || undefined,
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

      router.replace("/(campo)/pendientes");
    } catch {
      setError("No se pudo guardar la supervisión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}

      <Text style={{ fontWeight: "600" }}>Progreso de evaluación</Text>
      <Text>
        {valores.length} de {criterios.length} criterios puntuados
      </Text>
      <Text
        style={{
          fontWeight: "700",
          color:
            valores.length === criterios.length && criterios.length > 0
              ? "#059669"
              : "#2563eb",
        }}
      >
        {progreso}%
      </Text>

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Identificación</Text>
      <Text>
        Seleccione el territorio y los datos correspondientes al agente
        sanitario.
      </Text>

      <Desplegable
        titulo="Sector"
        placeholder="Todos los sectores"
        valor={
          sectorFiltro == null
            ? ""
            : sectorFiltro === 0
              ? "SIN_SECTOR"
              : String(sectorFiltro)
        }
        opciones={[
          { valor: "", etiqueta: "Todos los sectores" },
          { valor: "SIN_SECTOR", etiqueta: "Sin sector asignado" },
          ...sectores.map((sector) => ({
            valor: String(sector.id),
            etiqueta: nombreSector(sector),
          })),
        ]}
        onChange={(valor) => {
          if (valor === "") {
            setSectorFiltro(null);
            return;
          }
          if (valor === "SIN_SECTOR") {
            setSectorFiltro(0);
            const actual = agentes.find((item) => item.id === agenteId);
            if (actual && actual.sector_id != null) {
              setAgenteId(null);
            }
            return;
          }
          const id = Number(valor);
          setSectorFiltro(id);
          const actual = agentes.find((item) => item.id === agenteId);
          if (actual && actual.sector_id !== id) {
            setAgenteId(null);
          }
        }}
      />

      <Desplegable
        titulo="Agente sanitario"
        placeholder={
          agentesFiltrados.length === 0
            ? "No hay agentes asignados"
            : "Seleccione un agente"
        }
        valor={agenteId == null ? "" : String(agenteId)}
        deshabilitado={agentesFiltrados.length === 0}
        opciones={agentesFiltrados.map((agente) => ({
          valor: String(agente.id),
          etiqueta: `${agente.apellido}, ${agente.nombre}`,
        }))}
        onChange={(valor) => {
          const id = Number(valor);
          setAgenteId(id);
          const agente = agentes.find((item) => item.id === id);
          if (!agente) {
            return;
          }
          setSectorFiltro(agente.sector_id ?? 0);
        }}
      />

      <Desplegable
        titulo="Ronda"
        placeholder="Seleccione una ronda"
        valor={rondaId == null ? "" : String(rondaId)}
        opciones={rondas.map((ronda) => ({
          valor: String(ronda.id),
          etiqueta: ronda.nombre,
        }))}
        onChange={(valor) => setRondaId(Number(valor))}
      />

      <Text>Fecha</Text>
      <TextInput
        value={fecha}
        onChangeText={(valor) => setFecha(enmascararFecha(valor))}
        placeholder="dd/mm/aaaa"
        keyboardType="number-pad"
        maxLength={10}
        style={campo}
      />
      <Text>Familia N°</Text>
      <TextInput
        keyboardType="number-pad"
        value={familiaNumero}
        onChangeText={setFamiliaNumero}
        style={campo}
      />

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Evaluación</Text>
      <Text>Puntúe cada criterio utilizando la escala del 1 al 5.</Text>

      {bloques.length === 0 ? (
        <Text>No hay bloques de evaluación activos.</Text>
      ) : (
        bloques.map((bloque) => (
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
      ))
      )}

      <Text style={{ fontWeight: "600" }}>Observaciones del supervisor</Text>
      <Text>
        Registre los aspectos relevantes identificados durante la
        supervisión.
      </Text>
      <Text>Fortalezas observadas</Text>
      <Text>
        Aspectos positivos identificados durante la supervisión.
      </Text>
      <TextInput
        placeholder="Describa las fortalezas observadas..."
        value={fortalezas}
        onChangeText={setFortalezas}
        multiline
        style={[campo, { minHeight: 80 }]}
      />
      <Text>Oportunidades de mejora</Text>
      <Text>Aspectos que pueden fortalecerse o corregirse.</Text>
      <TextInput
        placeholder="Describa las oportunidades de mejora..."
        value={oportunidadesMejora}
        onChangeText={setOportunidadesMejora}
        multiline
        style={[campo, { minHeight: 80 }]}
      />
      <Text>Situaciones críticas detectadas</Text>
      <Text>Registre situaciones que requieran especial atención.</Text>
      <TextInput
        placeholder="Describa las situaciones críticas..."
        value={situacionesCriticas}
        onChangeText={setSituacionesCriticas}
        multiline
        style={[campo, { minHeight: 80 }]}
      />
      <Text>Recomendaciones</Text>
      <Text>Acciones sugeridas a partir de la supervisión.</Text>
      <TextInput
        placeholder="Ingrese las recomendaciones..."
        value={recomendaciones}
        onChangeText={setRecomendaciones}
        multiline
        style={[campo, { minHeight: 80 }]}
      />

      <Text style={{ fontWeight: "600" }}>Decisión de gestión</Text>
      <Text>
        Seleccione la acción que corresponde según los resultados y
        observaciones.
      </Text>
      <Text style={{ fontWeight: "600" }}>¿Requiere intervención?</Text>
      {decisiones.map((item) => (
        <Pressable key={item} onPress={() => setDecision(item)}>
          <Text style={{ fontWeight: decision === item ? "700" : "400" }}>
            {etiquetasGestion[item]}
          </Text>
        </Pressable>
      ))}
      <Text>{ayudasGestion[decision]}</Text>

      <Text style={{ fontWeight: "600" }}>Resultado general</Text>
      <Text>
        El resultado se calcula automáticamente a partir de las puntuaciones
        registradas.
      </Text>
      {promedio == null ? (
        <>
          <Text style={{ fontWeight: "600" }}>Evaluación pendiente</Text>
          <Text>
            Puntúe los criterios para comenzar a calcular el resultado.
          </Text>
        </>
      ) : (
        <>
          <Text>Promedio actual {promedio.toFixed(2)}</Text>
          <Text>sobre 5.00</Text>
          <Text>
            Clasificación{" "}
            {etiquetasClasificacion[calcularClasificacion(promedio)]}
          </Text>
        </>
      )}

      <Pressable
        onPress={() => router.replace("/(campo)/historial")}
        disabled={guardando}
        style={{
          padding: 14,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#cbd5e1",
          opacity: guardando ? 0.6 : 1,
        }}
      >
        <Text style={{ textAlign: "center" }}>Cancelar</Text>
      </Pressable>
      <Pressable
        onPress={() => void guardar()}
        disabled={guardando || valores.length !== criterios.length}
        style={{
          backgroundColor: "#0f172a",
          padding: 14,
          borderRadius: 8,
          opacity:
            guardando || valores.length !== criterios.length ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          {guardando ? "Guardando..." : "Guardar supervisión"}
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
