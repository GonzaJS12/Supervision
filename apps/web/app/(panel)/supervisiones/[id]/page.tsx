import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { buscarSupervision } from "@/lib/server/supervisiones";
import { ErrorNegocio, parseIdPagina } from "@/lib/errores";
import {
  etiquetasClasificacion,
  etiquetasGestion,
  descripcionesGestion,
  formatearFecha,
  escalaPuntuacion,
} from "@/lib/etiquetas";

export default async function DetalleSupervisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  const { id } = await params;
  const supervisionId = parseIdPagina(id);

  if (supervisionId == null) {
    return (
      <ErrorDetalleSupervision mensaje="No se indicó una supervisión." />
    );
  }

  let supervision;

  try {
    supervision = await buscarSupervision(sesion, supervisionId);
  } catch (error) {
    if (error instanceof ErrorNegocio) {
      return (
        <ErrorDetalleSupervision mensaje="No se pudo cargar la supervisión." />
      );
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link
        href="/supervisiones"
        className="inline-flex items-center justify-center self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        Volver al historial
      </Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
        Registro de supervisión
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        Detalle de supervisión
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Consulte la información territorial, evaluación, observaciones y
        resultado de la supervisión realizada.
      </p>

      <h2 className="mt-8 text-sm font-medium text-slate-900">
        Identificación
      </h2>
      <p className="text-xs text-slate-500">
        Datos generales asociados a la supervisión.
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-slate-500">Agente sanitario</dt>
          <dd>
            {supervision.agenteSanitario.apellido},{" "}
            {supervision.agenteSanitario.nombre}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Supervisor</dt>
          <dd>
            {supervision.supervisor.nombre} {supervision.supervisor.apellido}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Fecha</dt>
          <dd>{formatearFecha(supervision.fecha)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Área operativa</dt>
          <dd>{supervision.areaOperativa.nombre}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Sector</dt>
          <dd>
            {supervision.sector
              ? (supervision.sector.nombre ??
                `Sector ${supervision.sector.numero ?? ""}`)
              : "Sin sector asignado"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Familia N°</dt>
          <dd>
            {supervision.familiaNumero == null
              ? "No especificado"
              : String(supervision.familiaNumero)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Ronda</dt>
          <dd>
            {supervision.ronda?.nombre ??
              (supervision.rondaNumero != null
                ? String(supervision.rondaNumero)
                : "No especificada")}
          </dd>
        </div>
        {supervision.agenteSanitario.documento && (
          <div>
            <dt className="text-slate-500">Documento</dt>
            <dd>{supervision.agenteSanitario.documento}</dd>
          </div>
        )}
        {supervision.agenteSanitario.legajo && (
          <div>
            <dt className="text-slate-500">Legajo</dt>
            <dd>{supervision.agenteSanitario.legajo}</dd>
          </div>
        )}
      </dl>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-medium text-slate-900">Evaluación</h2>
          <p className="text-xs text-slate-500">
            Puntuaciones registradas para cada criterio de evaluación.
          </p>
        </div>
        <div className="grid gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:grid-cols-5">
          {escalaPuntuacion.map((item) => (
            <div key={item.valor} className="text-xs">
              <p className="font-semibold text-slate-700">{item.valor}</p>
              <p className="text-slate-500">{item.texto}</p>
            </div>
          ))}
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Criterio</th>
              <th className="px-4 py-3">Puntuación</th>
            </tr>
          </thead>
          <tbody>
            {supervision.evaluaciones.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={2}
                >
                  No hay evaluaciones registradas.
                </td>
              </tr>
            )}
            {supervision.evaluaciones.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {item.criterioNombre}
                  {item.criterioDescripcion && (
                    <p className="text-xs text-slate-500">
                      {item.criterioDescripcion}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((valor) => (
                      <span
                        key={valor}
                        className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold ${
                          item.puntuacion === valor
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-400"
                        }`}
                      >
                        {valor}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-900">
          Observaciones del supervisor
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Aspectos cualitativos registrados durante la supervisión.
        </p>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <p>
            <span className="text-slate-500">Fortalezas observadas: </span>
            {supervision.fortalezas?.trim()
              ? supervision.fortalezas
              : "Sin observaciones registradas."}
          </p>
          <p>
            <span className="text-slate-500">Oportunidades de mejora: </span>
            {supervision.oportunidadesMejora?.trim()
              ? supervision.oportunidadesMejora
              : "Sin observaciones registradas."}
          </p>
          <p>
            <span className="text-slate-500">Situaciones críticas: </span>
            {supervision.situacionesCriticas?.trim()
              ? supervision.situacionesCriticas
              : "Sin observaciones registradas."}
          </p>
          <p>
            <span className="text-slate-500">Recomendaciones: </span>
            {supervision.recomendaciones?.trim()
              ? supervision.recomendaciones
              : "Sin observaciones registradas."}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium text-slate-900">
          Resultado general
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Resultado calculado a partir de las puntuaciones registradas.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Promedio
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {(() => {
                const promedio =
                  supervision.promedio == null
                    ? null
                    : Number(supervision.promedio);
                return promedio !== null && !Number.isNaN(promedio)
                  ? promedio.toFixed(2)
                  : "—";
              })()}
              <span className="ml-2 text-sm font-medium text-slate-400">
                / 5.00
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Clasificación
            </p>
            <p className="mt-2 font-semibold text-slate-800">
              {supervision.clasificacion
                ? etiquetasClasificacion[supervision.clasificacion]
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Decisión de gestión
            </p>
            <p className="mt-2 font-semibold text-slate-800">
              {etiquetasGestion[supervision.decisionGestion]}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {descripcionesGestion[supervision.decisionGestion]}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Escala de clasificación
          </p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 text-xs">
            <p>Crítico · 1.0 – 2.5</p>
            <p>Regular · 2.6 – 3.5</p>
            <p>Bueno · 3.6 – 4.5</p>
            <p>Excelente · 4.6 – 5.0</p>
          </div>
        </div>
      </section>

      <div className="mt-8 flex justify-end pb-8">
        <Link
          href="/supervisiones"
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
        >
          Volver a supervisiones
        </Link>
      </div>
    </main>
  );
}

function ErrorDetalleSupervision({ mensaje }: { mensaje: string }) {
  return (
    <main className="mx-auto max-w-2xl py-10">
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">
          No se pudo mostrar la supervisión
        </h1>
        <p className="mt-2 text-sm text-slate-500">{mensaje}</p>
        <Link
          href="/supervisiones"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Volver a supervisiones
        </Link>
      </div>
    </main>
  );
}
