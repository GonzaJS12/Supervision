import { listarAgentes, listarSectoresParaFiltro } from "@/lib/server/agentes";
import { listarAreasActivas } from "@/lib/server/usuarios";
import { obtenerSesion } from "@/lib/sesion";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FormularioFiltros } from "../formulario-filtros";

export default async function AgentesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    nombre?: string;
    areaOperativaId?: string;
    sectorId?: string;
  }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  const query = await searchParams;
  const page = Number(query.page ?? 1);
  const nombre = query.nombre ?? "";
  const areaOperativaId = query.areaOperativaId
    ? Number(query.areaOperativaId)
    : undefined;
  const sectorId = query.sectorId ? Number(query.sectorId) : undefined;

  let data: Awaited<ReturnType<typeof listarAgentes>>["data"] = [];
  let meta = { page: 1, limit: 15, total: 0, totalPages: 0 };
  let areas: Awaited<ReturnType<typeof listarAreasActivas>> = [];
  let sectores: Awaited<ReturnType<typeof listarSectoresParaFiltro>> = [];
  let error = "";

  try {
    const resultado = await listarAgentes({
      sesion,
      page,
      nombre,
      areaOperativaId,
      sectorId,
    });
    data = resultado.data;
    meta = resultado.meta;
  } catch {
    error = "No se pudieron cargar los agentes sanitarios.";
  }

  if (sesion.rol === "ADMIN") {
    try {
      areas = await listarAreasActivas();
    } catch {
      if (!error) {
        error = "No se pudieron cargar las áreas operativas.";
      }
    }
  }

  try {
    sectores = await listarSectoresParaFiltro(sesion, areaOperativaId);
  } catch {
    if (!error) {
      error = "No se pudieron cargar los sectores.";
    }
  }
  const paramsBase = new URLSearchParams();
  if (nombre) paramsBase.set("nombre", nombre);
  if (areaOperativaId) paramsBase.set("areaOperativaId", String(areaOperativaId));
  if (sectorId) paramsBase.set("sectorId", String(sectorId));

  function hrefPagina(p: number) {
    const params = new URLSearchParams(paramsBase);
    params.set("page", String(p));
    return `/agentes?${params.toString()}`;
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
        Gestión territorial
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        Agentes sanitarios
      </h1>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          {sesion.rol === "ADMIN"
            ? "Consulte los agentes sanitarios registrados en las distintas áreas operativas."
            : "Consulte los agentes sanitarios pertenecientes a su área operativa."}
        </p>
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Total
          </span>
          <span className="ml-2 font-semibold text-slate-800">
            {meta.total} {meta.total === 1 ? "agente" : "agentes"}
          </span>
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <FormularioFiltros className="mt-6 space-y-3" action="/agentes">
        <div>
          <h2 className="font-medium text-slate-900">Filtrar agentes</h2>
          <p className="text-xs text-slate-500">
            Busque por nombre, apellido o ubicación territorial.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm font-semibold text-slate-700">
          Agente
          <input
            name="nombre"
            defaultValue={nombre}
            placeholder="Nombre o apellido"
            className="mt-1 block w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
          />
        </label>
        {sesion.rol === "ADMIN" && (
          <label className="text-sm font-semibold text-slate-700">
            Área operativa
            <select
              name="areaOperativaId"
              defaultValue={areaOperativaId ?? ""}
              className="mt-1 block rounded-lg border px-3 py-2 text-sm font-normal"
            >
              <option value="">Todas las áreas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm font-semibold text-slate-700">
          Sector
          <select
            name="sectorId"
            defaultValue={sectorId ?? ""}
            disabled={sesion.rol === "ADMIN" && !areaOperativaId}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm font-normal disabled:bg-slate-100"
          >
            <option value="">
              {sesion.rol === "ADMIN" && !areaOperativaId
                ? "Seleccione un área"
                : "Todos los sectores"}
            </option>
            {sectores.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.nombre || `Sector ${sector.numero}`}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="sr-only">
          Buscar
        </button>
        {(nombre || areaOperativaId || sectorId) && (
          <Link href="/agentes" className="rounded-lg border px-4 py-2 text-sm">
            Limpiar filtros
          </Link>
        )}
        </div>
      </FormularioFiltros>

      <p className="mt-3 text-sm text-slate-500">
        {nombre || areaOperativaId || sectorId
          ? `${meta.total} agente${meta.total === 1 ? "" : "s"} encontrado${meta.total === 1 ? "" : "s"}`
          : `${meta.total} agente${meta.total === 1 ? "" : "s"} registrado${meta.total === 1 ? "" : "s"}`}
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Listado de agentes</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Seleccione un agente para consultar su información e historial.
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Agente</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Área operativa</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Cobertura</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={7}
                >
                  {nombre || areaOperativaId || sectorId ? (
                    <>
                      <p className="font-semibold text-slate-700">
                        No se encontraron agentes
                      </p>
                      <p className="mt-1">
                        Pruebe modificando o eliminando alguno de los filtros
                        seleccionados.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-700">
                        No hay agentes registrados
                      </p>
                      <p className="mt-1">
                        Actualmente no existen agentes sanitarios disponibles.
                      </p>
                    </>
                  )}
                </td>
              </tr>
            )}
            {data.map((agente) => (
              <tr key={agente.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">
                    {agente.apellido}, {agente.nombre}
                  </p>
                  {agente.legajo ? (
                    <p className="text-xs text-slate-400">
                      Legajo {agente.legajo}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">{agente.documento || "-"}</td>
                <td className="px-4 py-3">
                  {agente.areaOperativa?.nombre ||
                    `Área ${agente.areaOperativaId}`}
                </td>
                <td className="px-4 py-3">
                  {agente.sector ? (
                    agente.sector.nombre || `Sector ${agente.sector.numero}`
                  ) : (
                    <span className="text-slate-400">Sin sector</span>
                  )}
                </td>
                <td className="px-4 py-3">{agente.cobertura || "-"}</td>
                <td className="px-4 py-3">
                  {agente.activo ? (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                    href={`/agentes/${agente.id}`}
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
