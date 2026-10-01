"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DecisionGestion } from "@supervision/domain";
import { calcularClasificacion, calcularPromedio } from "@supervision/domain";
import { etiquetasClasificacion, etiquetasGestion } from "@/lib/etiquetas";

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
};

const decisiones: DecisionGestion[] = [
  "NO_REQUIERE",
  "SEGUIMIENTO",
  "CAPACITACION",
  "SUPERVISION_INTENSIVA",
];

export function FormularioSupervision({
  areas,
  rondas,
  bloques,
  areaFijaId,
  agenteInicialId,
  areaInicialId,
}: {
  areas: Area[];
  rondas: Ronda[];
  bloques: Bloque[];
  areaFijaId: number | null;
  agenteInicialId?: number | null;
  areaInicialId?: number | null;
}) {
  const router = useRouter();
  const [areaId, setAreaId] = useState(
    areaFijaId
      ? String(areaFijaId)
      : areaInicialId
        ? String(areaInicialId)
        : areas[0]
          ? String(areas[0].id)
          : "",
  );
  const [sectorFiltro, setSectorFiltro] = useState("");
  const [agenteId, setAgenteId] = useState(
    agenteInicialId ? String(agenteInicialId) : "",
  );
  const [rondaId, setRondaId] = useState(rondas[0] ? String(rondas[0].id) : "");
  const [fecha, setFecha] = useState(
    new Date().toISOString().slice(0, 10),
  );
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
      const respuesta = await fetch(
        `/api/v1/catalogo/territorio?areaOperativaId=${areaId}`,
      );
      const datos = (await respuesta.json()) as {
        sectores?: Sector[];
        agentes?: Agente[];
        error?: string;
      };

      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo cargar el territorio");
        setSectores([]);
        setAgentes([]);
        return;
      }

      setSectores(datos.sectores ?? []);
      setAgentes(datos.agentes ?? []);

      const agentesCargados = datos.agentes ?? [];
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

  const promedioPreview =
    valores.length === criterios.length && criterios.length > 0
      ? calcularPromedio(valores)
      : null;

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    setError("");

    if (!agenteSeleccionado) {
      setError("Debe seleccionar un agente");
      return;
    }

    if (valores.length !== criterios.length) {
      setError("Debe puntuar todos los criterios (1 a 5)");
      return;
    }

    setGuardando(true);

    const respuesta = await fetch("/api/v1/supervisiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agenteSanitarioId: agenteSeleccionado.id,
        areaOperativaId: Number(areaId),
        sectorId: agenteSeleccionado.sectorId,
        rondaId: Number(rondaId),
        fecha,
        familiaNumero: familiaNumero ? Number(familiaNumero) : null,
        decisionGestion,
        fortalezas,
        oportunidadesMejora,
        situacionesCriticas,
        recomendaciones,
        evaluaciones: criterios.map((criterio) => ({
          criterioId: criterio.id,
          puntuacion: puntuaciones[criterio.id],
        })),
      }),
    });

    const datos = (await respuesta.json()) as { id?: number; error?: string };

    if (!respuesta.ok) {
      setError(datos.error ?? "No se pudo guardar la supervisión");
      setGuardando(false);
      return;
    }

    router.push(`/supervisiones/${datos.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Área operativa
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={areaId}
            disabled={areaFijaId != null}
            onChange={(e) => setAreaId(e.target.value)}
          >
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Sector (filtro)
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={sectorFiltro}
            onChange={(e) => {
              setSectorFiltro(e.target.value);
              setAgenteId("");
            }}
          >
            <option value="">Todos</option>
            <option value="SIN_SECTOR">Sin sector asignado</option>
            {sectores.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.numero} {sector.nombre ?? ""}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Agente
          <select
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={agenteId}
            onChange={(e) => setAgenteId(e.target.value)}
          >
            <option value="">Seleccionar</option>
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
            type="date"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
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
        <p className="text-sm text-slate-500">
          Sector del agente:{" "}
          {agenteSeleccionado.sectorId
            ? sectores.find((s) => s.id === agenteSeleccionado.sectorId)
                ?.nombre ?? agenteSeleccionado.sectorId
            : "Sin sector asignado"}
        </p>
      )}

      {bloques.map((bloque) => (
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
      ))}

      {promedioPreview != null && (
        <p className="text-sm text-slate-700">
          Promedio: {promedioPreview.toFixed(2)} ·{" "}
          {etiquetasClasificacion[calcularClasificacion(promedioPreview)]}
        </p>
      )}

      <label className="block text-sm">
        Decisión de gestión
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
      </label>

      <label className="block text-sm">
        Fortalezas
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          value={fortalezas}
          onChange={(e) => setFortalezas(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Oportunidades de mejora
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          value={oportunidadesMejora}
          onChange={(e) => setOportunidadesMejora(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Situaciones críticas
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          value={situacionesCriticas}
          onChange={(e) => setSituacionesCriticas(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Recomendaciones
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          value={recomendaciones}
          onChange={(e) => setRecomendaciones(e.target.value)}
        />
      </label>

      <button
        type="submit"
        disabled={guardando || rondas.length === 0 || criterios.length === 0}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {guardando ? "Guardando..." : "Registrar supervisión"}
      </button>
    </form>
  );
}
