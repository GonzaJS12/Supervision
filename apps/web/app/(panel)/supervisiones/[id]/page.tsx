import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { buscarSupervision } from "@/lib/server/supervisiones";
import { ErrorNegocio } from "@/lib/errores";
import {
  etiquetasClasificacion,
  etiquetasGestion,
  formatearFecha,
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

  let supervision;

  try {
    supervision = await buscarSupervision(sesion, Number(id));
  } catch (error) {
    if (error instanceof ErrorNegocio && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link href="/supervisiones" className="text-sm text-slate-500 underline">
        Volver al listado
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">
        Supervisión #{supervision.id}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {formatearFecha(supervision.fecha)} ·{" "}
        <Link
          className="underline"
          href={`/agentes/${supervision.agenteSanitario.id}`}
        >
          {supervision.agenteSanitario.apellido},{" "}
          {supervision.agenteSanitario.nombre}
        </Link>
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-slate-500">Área</dt>
          <dd>{supervision.areaOperativa.nombre}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Sector</dt>
          <dd>
            {supervision.sector
              ? `${supervision.sector.numero} ${supervision.sector.nombre ?? ""}`
              : "Sin sector asignado"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Ronda</dt>
          <dd>{supervision.ronda?.nombre ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Supervisor</dt>
          <dd>
            {supervision.supervisor.apellido}, {supervision.supervisor.nombre}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Promedio</dt>
          <dd>
            {supervision.promedio == null
              ? "—"
              : supervision.promedio.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Clasificación</dt>
          <dd>
            {supervision.clasificacion
              ? etiquetasClasificacion[supervision.clasificacion]
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Gestión</dt>
          <dd>{etiquetasGestion[supervision.decisionGestion]}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Familia N°</dt>
          <dd>{supervision.familiaNumero ?? "—"}</dd>
        </div>
      </dl>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Criterio</th>
              <th className="px-4 py-3">Puntuación</th>
            </tr>
          </thead>
          <tbody>
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
                <td className="px-4 py-3">{item.puntuacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-6 space-y-3 text-sm">
        <p>
          <span className="text-slate-500">Fortalezas: </span>
          {supervision.fortalezas || "—"}
        </p>
        <p>
          <span className="text-slate-500">Oportunidades de mejora: </span>
          {supervision.oportunidadesMejora || "—"}
        </p>
        <p>
          <span className="text-slate-500">Situaciones críticas: </span>
          {supervision.situacionesCriticas || "—"}
        </p>
        <p>
          <span className="text-slate-500">Recomendaciones: </span>
          {supervision.recomendaciones || "—"}
        </p>
      </div>
    </main>
  );
}
