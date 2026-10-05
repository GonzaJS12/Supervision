import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { listarSupervisiones } from "@/lib/server/supervisiones";
import {
  etiquetasClasificacion,
  etiquetasGestion,
  formatearFecha,
  formatearPromedio,
} from "@/lib/etiquetas";
import { FormularioFiltros } from "../formulario-filtros";
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
  } catch {
    errorFiltro =
      sesion.rol === "SUPERVISOR"
        ? "No se pudieron cargar sus supervisiones."
        : "No se pudieron cargar las supervisiones.";
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Seguimiento
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {sesion.rol === "ADMIN"
              ? "Supervisiones"
              : "Mis supervisiones"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {sesion.rol === "ADMIN"
              ? "Consulte y analice el historial de supervisiones realizadas a los agentes sanitarios."
              : "Consulte el historial de las supervisiones que usted ha realizado."}
          </p>
        </div>
        <div className="flex gap-2">
          <BotonExportarPdf
            titulo={
              sesion.rol === "ADMIN"
                ? "Reporte global de supervisiones"
                : "Reporte de mis supervisiones"
            }
            nombreArchivo={
              sesion.rol === "ADMIN"
                ? "supervisiones-global"
                : "mis-supervisiones"
            }
            supervisor={
              sesion.rol === "SUPERVISOR"
                ? `${sesion.nombre} ${sesion.apellido}`
                : undefined
            }
            etiquetaCargando="Generando PDF..."
            deshabilitado={meta.total === 0}
          />
          <Link
            href="/supervisiones/nueva"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Nueva supervisión
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">
            {fechaDesde || fechaHasta || clasificacion
              ? "Resultados"
              : sesion.rol === "ADMIN"
                ? "Supervisiones registradas"
                : "Mis supervisiones"}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {meta.total}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {fechaDesde || fechaHasta || clasificacion
              ? `${meta.total} supervisión${meta.total === 1 ? "" : "es"} encontrada${meta.total === 1 ? "" : "s"}`
              : `${meta.total} supervisión${meta.total === 1 ? "" : "es"} registrada${meta.total === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">Página actual</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {meta.totalPages > 0 ? `${meta.page} / ${meta.totalPages}` : "—"}
          </p>
        </div>
      </div>

      <FormularioFiltros className="mt-6 space-y-3" action="/supervisiones">
        <div>
          <h2 className="font-medium text-slate-900">Filtrar supervisiones</h2>
          <p className="text-xs text-slate-500">
            Combine un rango de fechas con una clasificación.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        <label className="text-sm text-slate-700">
          Fecha desde
          <input
            type="date"
            name="fechaDesde"
            defaultValue={fechaDesde}
            max={fechaHasta || undefined}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-slate-700">
          Fecha hasta
          <input
            type="date"
            name="fechaHasta"
            defaultValue={fechaHasta}
            min={fechaDesde || undefined}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-slate-700">
          Clasificación
          <select
            name="clasificacion"
            defaultValue={clasificacion}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm"
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
        </label>
        <button type="submit" className="sr-only">
          Aplicar filtros
        </button>
        {(fechaDesde || fechaHasta || clasificacion) && (
          <Link
            href="/supervisiones"
            className="self-end rounded-lg border px-4 py-2 text-sm"
          >
            Limpiar filtros
          </Link>
        )}
        </div>
      </FormularioFiltros>

      {errorFiltro && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorFiltro}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Historial</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Seleccione una supervisión para consultar su evaluación completa.
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Agente</th>
              <th className="px-4 py-3">Área / Sector</th>
              {sesion.rol === "ADMIN" && (
                <th className="px-4 py-3">Supervisor</th>
              )}
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
                  colSpan={sesion.rol === "ADMIN" ? 8 : 7}
                >
                  {fechaDesde || fechaHasta || clasificacion ? (
                    <>
                      <p className="font-semibold text-slate-700">
                        No se encontraron supervisiones
                      </p>
                      <p className="mt-1">
                        Pruebe modificando el rango de fechas o la clasificación
                        seleccionada.
                      </p>
                    </>
                  ) : sesion.rol === "ADMIN" ? (
                    <>
                      <p className="font-semibold text-slate-700">
                        No hay supervisiones registradas
                      </p>
                      <p className="mt-1">
                        Las supervisiones realizadas aparecerán en este
                        historial.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-700">
                        Todavía no realizó supervisiones
                      </p>
                      <p className="mt-1">
                        Cuando realice una supervisión, podrá consultarla desde
                        esta pantalla.
                      </p>
                    </>
                  )}
                </td>
              </tr>
            )}
            {data.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{formatearFecha(item.fecha)}</td>
                <td className="px-4 py-3">
                  {item.agenteSanitario.apellido}, {item.agenteSanitario.nombre}
                  {item.agenteSanitario.legajo && (
                    <p className="text-xs text-slate-400">
                      Legajo {item.agenteSanitario.legajo}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p>{item.areaOperativa.nombre}</p>
                  <p className="text-xs text-slate-400">
                    {item.sector
                      ? item.sector.nombre ?? `Sector ${item.sector.numero}`
                      : "Sin sector asignado"}
                  </p>
                </td>
                {sesion.rol === "ADMIN" && (
                  <td className="px-4 py-3">
                    {item.supervisor.nombre} {item.supervisor.apellido}
                  </td>
                )}
                <td className="px-4 py-3">
                  {formatearPromedio(item.promedio)}
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
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.total > 0 && (
        <p className="mt-4 text-sm text-slate-500">
          Mostrando{" "}
          <span className="font-semibold text-slate-700">
            {(meta.page - 1) * meta.limit + 1}
          </span>
          {" – "}
          <span className="font-semibold text-slate-700">
            {Math.min(meta.page * meta.limit, meta.total)}
          </span>
          {" de "}
          <span className="font-semibold text-slate-700">{meta.total}</span>
        </p>
      )}

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
