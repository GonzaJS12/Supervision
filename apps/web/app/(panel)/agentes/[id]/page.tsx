import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { buscarAgente } from "@/lib/server/agentes";
import { listarSupervisionesPorAgente } from "@/lib/server/supervisiones";
import { ErrorNegocio } from "@/lib/errores";
import {
  etiquetasClasificacion,
  etiquetasGestion,
  formatearFecha,
} from "@/lib/etiquetas";

export default async function DetalleAgentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  const { id } = await params;
  let agente;

  try {
    agente = await buscarAgente(sesion, Number(id));
  } catch (error) {
    if (error instanceof ErrorNegocio && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const supervisiones = await listarSupervisionesPorAgente(
    sesion,
    agente.id,
  );

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link href="/agentes" className="text-sm text-slate-500 underline">
        Volver a agentes
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">
        {agente.apellido}, {agente.nombre}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Catálogo territorial de solo lectura.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-slate-500">Área</dt>
          <dd>{agente.areaOperativa.nombre}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Sector</dt>
          <dd>
            {agente.sector
              ? `${agente.sector.numero} ${agente.sector.nombre ?? ""}`
              : "Sin sector asignado"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Documento</dt>
          <dd>{agente.documento ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Legajo</dt>
          <dd>{agente.legajo ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Cobertura</dt>
          <dd>{agente.cobertura ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Estado</dt>
          <dd>{agente.activo ? "Activo" : "Inactivo"}</dd>
        </div>
      </dl>

      <div className="mt-6">
        {agente.activo ? (
          <Link
            href={`/supervisiones/nueva?agenteId=${agente.id}`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Nueva supervisión
          </Link>
        ) : (
          <p className="text-sm text-slate-500">
            No se puede supervisar un agente inactivo.
          </p>
        )}
      </div>

      <h2 className="mt-10 text-lg font-medium text-slate-900">
        Historial
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {sesion.rol === "SUPERVISOR"
          ? "Solo las supervisiones que registraste."
          : "Todas las supervisiones de este agente."}
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Promedio</th>
              <th className="px-4 py-3">Clasificación</th>
              <th className="px-4 py-3">Gestión</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {supervisiones.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={5}
                >
                  No hay supervisiones.
                </td>
              </tr>
            )}
            {supervisiones.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{formatearFecha(item.fecha)}</td>
                <td className="px-4 py-3">
                  {item.promedio == null ? "—" : item.promedio.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  {item.clasificacion
                    ? etiquetasClasificacion[item.clasificacion]
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {etiquetasGestion[item.decisionGestion]}
                </td>
                <td className="px-4 py-3">
                  <Link className="underline" href={`/supervisiones/${item.id}`}>
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
