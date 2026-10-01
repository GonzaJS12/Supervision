import { listarAgentes, listarSectoresParaFiltro } from "@/lib/server/agentes";
import { listarAreasActivas } from "@/lib/server/usuarios";
import { obtenerSesion } from "@/lib/sesion";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  const [resultado, areas, sectores] = await Promise.all([
    listarAgentes({
      sesion,
      page,
      nombre,
      areaOperativaId,
      sectorId,
    }),
    sesion.rol === "ADMIN" ? listarAreasActivas() : Promise.resolve([]),
    listarSectoresParaFiltro(sesion, areaOperativaId),
  ]);

  const { data, meta } = resultado;
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
      <h1 className="text-2xl font-semibold text-slate-900">
        Agentes sanitarios
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Catálogo de solo lectura. Los datos provienen del sistema territorial.
      </p>

      <form className="mt-6 flex flex-wrap gap-2" action="/agentes">
        <input
          name="nombre"
          defaultValue={nombre}
          placeholder="Buscar por nombre"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {sesion.rol === "ADMIN" && (
          <select
            name="areaOperativaId"
            defaultValue={areaOperativaId ?? ""}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todas las áreas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        )}
        <select
          name="sectorId"
          defaultValue={sectorId ?? ""}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Todos los sectores</option>
          {sectores.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.numero} {sector.nombre ?? ""}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Buscar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Agente</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={4}
                >
                  No hay agentes. Si es una base nueva, hay que importar
                  los datos territoriales.
                </td>
              </tr>
            )}
            {data.map((agente) => (
              <tr key={agente.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link className="underline" href={`/agentes/${agente.id}`}>
                    {agente.apellido}, {agente.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {agente.areaOperativa.nombre}
                </td>
                <td className="px-4 py-3">
                  {agente.sector
                    ? `${agente.sector.numero} ${agente.sector.nombre ?? ""}`
                    : "Sin sector asignado"}
                </td>
                <td className="px-4 py-3">
                  {agente.activo ? "Activo" : "Inactivo"}
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
