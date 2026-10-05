"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DecisionGestion } from "@supervision/domain";
import { calcularClasificacion } from "@supervision/domain";
import { extraerMensajeApi } from "@/lib/mensaje-api";
import { etiquetasClasificacion, etiquetasGestion, ayudasGestion, escalaPuntuacion } from "@/lib/etiquetas";

type Area = { id: number; nombre: string };
type Ronda = { id: number; nombre: string };
type Criterio = {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
};
type Bloque = {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
  criterios: Criterio[];
};
type Sector = { id: number; numero: number; nombre: string | null };
type Agente = {
  id: number;
  nombre: string;
  apellido: string;
  sectorId: number | null;
  areaOperativaId: number;
  documento?: string | null;
  cobertura?: string | null;
  activo?: boolean;
};

const decisiones: DecisionGestion[] = [
  "NO_REQUIERE",
  "SEGUIMIENTO",
  "CAPACITACION",
  "SUPERVISION_INTENSIVA",
];

function hoyEnDdMmAaaa() {
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, "0");
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${hoy.getFullYear()}`;
}

function enmascararFecha(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) {
    return digitos;
  }
  if (digitos.length <= 4) {
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function isoDesdeDdMmAaaa(texto: string) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) {
    return null;
  }

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const anio = Number(partes[3]);
  const fecha = new Date(anio, mes - 1, dia);

  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return null;
  }

  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function FormularioSupervision({
  areas,
  rondas,
  bloques,
  areaFijaId,
  esSupervisor,
  agenteInicialId,
  areaInicialId,
}: {
  areas: Area[];
  rondas: Ronda[];
  bloques: Bloque[];
  areaFijaId: number | null;
  esSupervisor?: boolean;
  agenteInicialId?: number | null;
  areaInicialId?: number | null;
}) {
  const router = useRouter();
  const [areaId, setAreaId] = useState(
    areaFijaId
      ? String(areaFijaId)
      : areaInicialId
        ? String(areaInicialId)
        : "",
  );
  const [sectorFiltro, setSectorFiltro] = useState("");
  const [agenteId, setAgenteId] = useState(
    agenteInicialId ? String(agenteInicialId) : "",
  );
  const [rondaId, setRondaId] = useState("");
  const [fecha, setFecha] = useState(hoyEnDdMmAaaa());
  const [familiaNumero, setFamiliaNumero] = useState("");
  const [decisionGestion, setDecisionGestion] =
    useState<DecisionGestion>("NO_REQUIERE");
  const [fortalezas, setFortalezas] = useState("");
  const [oportunidadesMejora, setOportunidadesMejora] = useState("");
  const [situacionesCriticas, setSituacionesCriticas] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [puntuaciones, setPuntuaciones] = useState<Record<number, number>>(
    {},
  );
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!areaId) {
      setSectores([]);
      setAgentes([]);
      return;
    }

    const cargar = async () => {
      setError("");
      const [respuestaSectores, respuestaAgentes] = await Promise.all([
        fetch(`/api/v1/sectores/area/${areaId}`),
        fetch(`/api/v1/agentes/area/${areaId}`),
      ]);

      const datosSectores = (await respuestaSectores.json()) as
        | Sector[]
        | { error?: string; message?: string };
      const datosAgentes = (await respuestaAgentes.json()) as
        | Agente[]
        | { error?: string; message?: string };

      if (!respuestaSectores.ok || !respuestaAgentes.ok) {
        const fallo = !respuestaSectores.ok ? datosSectores : datosAgentes;
        setError(
          extraerMensajeApi(
            Array.isArray(fallo) ? {} : fallo,
            "No se pudieron cargar los sectores y agentes del área seleccionada.",
          ),
        );
        setSectores([]);
        setAgentes([]);
        return;
      }

      const sectoresCargados = Array.isArray(datosSectores)
        ? datosSectores
        : [];
      const agentesCargados = Array.isArray(datosAgentes) ? datosAgentes : [];

      setSectores(sectoresCargados);
      setAgentes(agentesCargados);

      const preseleccionado = agentesCargados.find(
        (agente) => agente.id === agenteInicialId,
      );

      if (preseleccionado) {
        setAgenteId(String(preseleccionado.id));
        setSectorFiltro(
          preseleccionado.sectorId
            ? String(preseleccionado.sectorId)
            : "",
        );
      } else {
        setSectorFiltro("");
        setAgenteId("");
      }
    };

    void cargar();
  }, [areaId, agenteInicialId]);

  const agentesFiltrados = useMemo(() => {
    if (!sectorFiltro) {
      return agentes;
    }

    if (sectorFiltro === "SIN_SECTOR") {
      return agentes.filter((agente) => agente.sectorId == null);
    }

    return agentes.filter(
      (agente) => agente.sectorId === Number(sectorFiltro),
    );
  }, [agentes, sectorFiltro]);

  const agenteSeleccionado = agentes.find(
    (agente) => agente.id === Number(agenteId),
  );

  const criterios = bloques.flatMap((bloque) => bloque.criterios);
  const valores = criterios
    .map((criterio) => puntuaciones[criterio.id])
    .filter((valor): valor is number => valor != null);
  const valoresParciales = Object.values(puntuaciones);
  const progreso =
    criterios.length === 0
      ? 0
      : Math.round((valores.length / criterios.length) * 100);
  const faltan = Math.max(criterios.length - valores.length, 0);
  const formularioCompleto =
    criterios.length > 0 && valores.length === criterios.length;

  const promedioPreview =
    valoresParciales.length === 0
      ? null
      : Number(
          (
            valoresParciales.reduce((total, valor) => total + valor, 0) /
            valoresParciales.length
          ).toFixed(2),
        );

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    setError("");

    if (!areaId) {
      setError("Debe seleccionar un área operativa.");
      return;
    }

    if (!agenteSeleccionado) {
      setError("Debe seleccionar un agente sanitario.");
      return;
    }

    if (agenteSeleccionado.activo === false) {
      setError(
        "No se puede crear una supervisión para un agente inactivo.",
      );
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

    if (valores.length !== criterios.length) {
      setError("Debe puntuar todos los criterios de evaluación.");
      return;
    }

    setGuardando(true);

    const respuesta = await fetch("/api/v1/supervisiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agenteSanitarioId: agenteSeleccionado.id,
        areaOperativaId: Number(areaId),
        sectorId: agenteSeleccionado.sectorId ?? undefined,
        rondaId: Number(rondaId),
        fecha: new Date(`${fechaIso}T12:00:00`).toISOString(),
        familiaNumero: familiaNumero ? Number(familiaNumero) : undefined,
        decisionGestion,
        fortalezas: fortalezas || undefined,
        oportunidadesMejora: oportunidadesMejora || undefined,
        situacionesCriticas: situacionesCriticas || undefined,
        recomendaciones: recomendaciones || undefined,
        evaluaciones: criterios.map((criterio) => ({
          criterioId: criterio.id,
          puntuacion: puntuaciones[criterio.id],
        })),
      }),
    });

    const datos = (await respuesta.json()) as {
      id?: number;
      error?: string;
      message?: string | string[];
    };

    if (!respuesta.ok) {
      setError(
        extraerMensajeApi(datos, "No se pudo guardar la supervisión."),
      );
      setGuardando(false);
      return;
    }

    router.push("/supervisiones");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-slate-800">Progreso de evaluación</p>
            <p className="mt-1 text-slate-500">
              {valores.length} de {criterios.length} criterios puntuados
            </p>
          </div>
          <span
            className={`text-sm font-bold ${
              formularioCompleto ? "text-emerald-600" : "text-blue-600"
            }`}
          >
            {progreso}%
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${
              formularioCompleto ? "bg-emerald-500" : "bg-blue-500"
            }`}
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm font-medium text-slate-900">
          Identificación
        </p>
        <p className="-mt-2 sm:col-span-2 text-xs text-slate-500">
          Seleccione el territorio y los datos correspondientes al agente
          sanitario.
        </p>
        {esSupervisor ? (
          <label className="text-sm">
            Área operativa
            <input
              readOnly
              className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-700"
              value={
                areas.find((area) => area.id === areaFijaId)?.nombre ??
                "Sin área asignada"
              }
            />
          </label>
        ) : (
        <label className="text-sm">
          Área operativa
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
          >
            <option value="">Seleccione un área</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        </label>
        )}

        <label className="text-sm">
          Sector
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={sectorFiltro}
            onChange={(e) => {
              setSectorFiltro(e.target.value);
              setAgenteId("");
            }}
          >
            <option value="">
              Todos los sectores
            </option>
            <option value="SIN_SECTOR">
              Sin sector asignado
            </option>
            {sectores.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.nombre?.trim() || "Sin nombre"}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Agente sanitario
          <select
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={agenteId}
            onChange={(e) => {
              const valor = e.target.value;
              setAgenteId(valor);
              const agente = agentes.find((item) => item.id === Number(valor));
              if (!agente) {
                return;
              }
              setSectorFiltro(
                agente.sectorId == null
                  ? "SIN_SECTOR"
                  : String(agente.sectorId),
              );
            }}
          >
            <option value="">
              {!areaId
                ? "Seleccione primero un área"
                : agentesFiltrados.length === 0
                  ? "No hay agentes asignados"
                  : "Seleccione un agente"}
            </option>
            {agentesFiltrados.map((agente) => (
              <option key={agente.id} value={agente.id}>
                {agente.apellido}, {agente.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Ronda
          <select
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={rondaId}
            onChange={(e) => setRondaId(e.target.value)}
          >
            <option value="">Seleccione una ronda</option>
            {rondas.map((ronda) => (
              <option key={ronda.id} value={ronda.id}>
                {ronda.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Fecha
          <input
            type="text"
            inputMode="numeric"
            required
            placeholder="dd/mm/aaaa"
            maxLength={10}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={fecha}
            onChange={(e) => setFecha(enmascararFecha(e.target.value))}
          />
        </label>

        <label className="text-sm">
          Familia N°
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={familiaNumero}
            onChange={(e) => setFamiliaNumero(e.target.value)}
          />
        </label>
      </section>

      {agenteSeleccionado && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium text-slate-900">Agente seleccionado</p>
          <p className="mt-1 text-slate-700">
            {agenteSeleccionado.apellido}, {agenteSeleccionado.nombre}
          </p>
          <p className="mt-2 text-slate-500">
            Documento: {agenteSeleccionado.documento ?? "Sin información"}
          </p>
          <p className="text-slate-500">
            Cobertura: {agenteSeleccionado.cobertura ?? "Sin información"}
          </p>
          <p className="text-slate-500">
            Sector:{" "}
            {agenteSeleccionado.sectorId
              ? sectores.find((s) => s.id === agenteSeleccionado.sectorId)
                  ?.nombre ?? `Sector ${agenteSeleccionado.sectorId}`
              : "Sin sector asignado"}
          </p>
        </div>
      )}

      <p className="text-sm font-medium text-slate-900">Evaluación</p>
      <p className="text-xs text-slate-500">
        Puntúe cada criterio utilizando la escala del 1 al 5.
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Escala de puntuación
        </p>
        <div className="grid gap-2 sm:grid-cols-5">
          {escalaPuntuacion.map((item) => (
            <div key={item.valor} className="text-sm">
              <p className="font-semibold text-slate-800">{item.valor}</p>
              <p className="text-xs text-slate-500">{item.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {bloques.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
          No hay bloques de evaluación activos.
        </div>
      ) : (
      bloques.map((bloque) => (
        <section
          key={bloque.id}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <h2 className="font-medium text-slate-900">{bloque.nombre}</h2>
          {bloque.descripcion && (
            <p className="mt-1 text-sm text-slate-500">{bloque.descripcion}</p>
          )}
          <div className="mt-4 space-y-4">
            {bloque.criterios.map((criterio) => (
              <div key={criterio.id}>
                <p className="text-sm text-slate-800">{criterio.nombre}</p>
                {criterio.descripcion && (
                  <p className="mt-1 text-xs text-slate-500">
                    {criterio.descripcion}
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((valor) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() =>
                        setPuntuaciones((actual) => ({
                          ...actual,
                          [criterio.id]: valor,
                        }))
                      }
                      className={`h-9 w-9 rounded-lg border text-sm ${
                        puntuaciones[criterio.id] === valor
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {valor}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))
      )}

      <p className="text-sm font-medium text-slate-900">
        Observaciones del supervisor
      </p>
      <p className="text-xs text-slate-500">
        Registre los aspectos relevantes identificados durante la supervisión.
      </p>

      <label className="block text-sm">
        Fortalezas observadas
        <p className="text-xs font-normal text-slate-500">
          Aspectos positivos identificados durante la supervisión.
        </p>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          placeholder="Describa las fortalezas observadas..."
          value={fortalezas}
          onChange={(e) => setFortalezas(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Oportunidades de mejora
        <p className="text-xs font-normal text-slate-500">
          Aspectos que pueden fortalecerse o corregirse.
        </p>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          placeholder="Describa las oportunidades de mejora..."
          value={oportunidadesMejora}
          onChange={(e) => setOportunidadesMejora(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Situaciones críticas detectadas
        <p className="text-xs font-normal text-slate-500">
          Registre situaciones que requieran especial atención.
        </p>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          placeholder="Describa las situaciones críticas..."
          value={situacionesCriticas}
          onChange={(e) => setSituacionesCriticas(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Recomendaciones
        <p className="text-xs font-normal text-slate-500">
          Acciones sugeridas a partir de la supervisión.
        </p>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          placeholder="Ingrese las recomendaciones..."
          value={recomendaciones}
          onChange={(e) => setRecomendaciones(e.target.value)}
        />
      </label>

      <p className="text-sm font-medium text-slate-900">Decisión de gestión</p>
      <p className="text-xs text-slate-500">
        Seleccione la acción que corresponde según los resultados y
        observaciones.
      </p>
      <p className="text-sm font-semibold text-slate-700">
        ¿Requiere intervención?
      </p>
      <label className="block text-sm">
        <select
          className="mt-1 w-full max-w-md rounded-lg border px-3 py-2"
          value={decisionGestion}
          onChange={(e) =>
            setDecisionGestion(e.target.value as DecisionGestion)
          }
        >
          {decisiones.map((decision) => (
            <option key={decision} value={decision}>
              {etiquetasGestion[decision]}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          {ayudasGestion[decisionGestion]}
        </span>
      </label>

      <p className="text-sm font-medium text-slate-900">Resultado general</p>
      <p className="text-xs text-slate-500">
        El resultado se calcula automáticamente a partir de las puntuaciones
        registradas.
      </p>
      {promedioPreview == null ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
          <p className="font-semibold text-slate-700">Evaluación pendiente</p>
          <p className="mt-1 text-sm text-slate-500">
            Puntúe los criterios para comenzar a calcular el resultado.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Promedio actual
            </p>
            <p className="mt-2 text-4xl font-bold text-slate-900">
              {promedioPreview.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-400">sobre 5.00</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Clasificación
            </p>
            <p className="mt-3 font-semibold text-slate-800">
              {
                etiquetasClasificacion[
                  calcularClasificacion(promedioPreview)
                ]
              }
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Escala de clasificación
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <p>Crítico · 1.0 – 2.5</p>
              <p>Regular · 2.6 – 3.5</p>
              <p>Bueno · 3.6 – 4.5</p>
              <p>Excelente · 4.6 – 5.0</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-xs text-slate-500 sm:text-left">
          {!formularioCompleto
            ? `Faltan ${faltan} criterio${faltan === 1 ? "" : "s"} por puntuar.`
            : "Todos los criterios fueron puntuados."}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/supervisiones")}
            disabled={guardando}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !formularioCompleto}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar supervisión"}
          </button>
        </div>
      </div>
    </form>
  );
}
