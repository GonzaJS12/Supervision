import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { listarSupervisiones } from "@/lib/server/supervisiones";
import {
  etiquetasClasificacion,
  etiquetasGestion,
  formatearFecha,
} from "@/lib/etiquetas";
import { BotonExportarPdf } from "./boton-pdf";
import type { Clasificacion } from "@supervision/domain";

export default async function SupervisionesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    clasificacion?: string;
  }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  const query = await searchParams;
  const page = Number(query.page ?? 1);
  const fechaDesde = query.fechaDesde ?? "";
  const fechaHasta = query.fechaHasta ?? "";
  const clasificacion = query.clasificacion ?? "";

  let data: Awaited<ReturnType<typeof listarSupervisiones>>["data"] = [];
  let meta = { page: 1, limit: 15, total: 0, totalPages: 0 };
  let errorFiltro = "";

  try {
    const resultado = await listarSupervisiones(sesion, {
      page,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
      clasificacion: clasificacion || undefined,
    });
    data = resultado.data;
    meta = resultado.meta;
  } catch (error) {
    errorFiltro =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar las supervisiones";
  }

  const queryBase = new URLSearchParams();
  if (fechaDesde) queryBase.set("fechaDesde", fechaDesde);
  if (fechaHasta) queryBase.set("fechaHasta", fechaHasta);
  if (clasificacion) queryBase.set("clasificacion", clasificacion);

  function hrefPagina(p: number) {
    const params = new URLSearchParams(queryBase);
    params.set("page", String(p));
    return `/supervisiones?${params.toString()}`;
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Supervisiones
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {sesion.rol === "ADMIN"
              ? "Historial completo."
              : "Solo las supervisiones que registraste."}
          </p>
        </div>
        <div className="flex gap-2">
          <BotonExportarPdf
            titulo={
              sesion.rol === "ADMIN"
                ? "Listado general de supervisiones"
                : "Mis supervisiones"
            }
            supervisor={
              sesion.rol === "SUPERVISOR"
                ? `${sesion.nombre} ${sesion.apellido}`
                : undefined
            }
          />
          <Link
            href="/supervisiones/nueva"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Nueva supervisión
          </Link>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/supervisiones">
        <input
          type="date"
          name="fechaDesde"
          defaultValue={fechaDesde}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="fechaHasta"
          defaultValue={fechaHasta}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <select
          name="clasificacion"
          defaultValue={clasificacion}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Todas las clasificaciones</option>
          {(
            ["CRITICO", "REGULAR", "BUENO", "EXCELENTE"] as Clasificacion[]
          ).map((item) => (
            <option key={item} value={item}>
              {etiquetasClasificacion[item]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Filtrar
        </button>
      </form>

      {errorFiltro && (
        <p className="mt-4 text-sm text-red-700">{errorFiltro}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Agente</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Promedio</th>
              <th className="px-4 py-3">Clasificación</th>
              <th className="px-4 py-3">Gestión</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={7}
                >
                  No hay supervisiones con esos filtros.
                </td>
              </tr>
            )}
            {data.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{formatearFecha(item.fecha)}</td>
                <td className="px-4 py-3">
                  <Link
                    className="underline"
                    href={`/agentes/${item.agenteSanitario.id}`}
                  >
                    {item.agenteSanitario.apellido},{" "}
                    {item.agenteSanitario.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3">{item.areaOperativa.nombre}</td>
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
                  <Link
                    className="underline"
                    href={`/supervisiones/${item.id}`}
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {page > 1 && (
            <Link className="rounded border px-3 py-1" href={hrefPagina(page - 1)}>
              Anterior
            </Link>
          )}
          <span className="px-2 py-1 text-slate-500">
            Página {meta.page} de {meta.totalPages}
          </span>
          {page < meta.totalPages && (
            <Link className="rounded border px-3 py-1" href={hrefPagina(page + 1)}>
              Siguiente
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
