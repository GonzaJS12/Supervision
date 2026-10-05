import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { buscarAgente } from "@/lib/server/agentes";
import { listarSupervisionesPorAgente } from "@/lib/server/supervisiones";
import { ErrorNegocio, parseIdPagina } from "@/lib/errores";
import {
  etiquetasClasificacion,
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
  const agenteId = parseIdPagina(id);

  if (agenteId == null) {
    return (
      <ErrorDetalleAgente mensaje="No se indicó un agente." />
    );
  }

  let agente;

  try {
    agente = await buscarAgente(sesion, agenteId);
  } catch (error) {
    if (error instanceof ErrorNegocio) {
      return (
        <ErrorDetalleAgente mensaje="No se pudo cargar la información del agente." />
      );
    }
    throw error;
  }

  let supervisiones;

  try {
    supervisiones = await listarSupervisionesPorAgente(sesion, agente.id);
  } catch (error) {
    if (error instanceof ErrorNegocio) {
      return (
        <ErrorDetalleAgente mensaje="No se pudo cargar la información del agente." />
      );
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <Link
        href="/agentes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
      >
        Volver a agentes
      </Link>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
        Agente sanitario
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {agente.apellido}, {agente.nombre}
        </h1>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            agente.activo
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          {agente.activo ? "Agente activo" : "Agente inactivo"}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Información territorial e historial de supervisiones
      </p>

      <h2 className="mt-6 text-sm font-medium text-slate-900">
        Información del agente
      </h2>
      <p className="text-xs text-slate-500">
        Datos obtenidos del sistema territorial.
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-slate-500">Nombre</dt>
          <dd>{agente.nombre}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Apellido</dt>
          <dd>{agente.apellido}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Área operativa</dt>
          <dd>
            {agente.areaOperativa.nombre ??
              `Área ${agente.areaOperativaId}`}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Sector</dt>
          <dd>
            {agente.sector
              ? agente.sector.nombre ?? `Sector ${agente.sector.numero}`
              : "Sin sector asignado"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Documento</dt>
          <dd>{agente.documento ?? "No informado"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Legajo</dt>
          <dd>{agente.legajo ?? "No informado"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Cobertura</dt>
          <dd>{agente.cobertura ?? "No informada"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Estado</dt>
          <dd>{agente.activo ? "Activo" : "Inactivo"}</dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-slate-900">
            {sesion.rol === "ADMIN"
              ? "Historial de supervisiones"
              : "Mis supervisiones a este agente"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {sesion.rol === "ADMIN"
              ? "Supervisiones registradas para este agente sanitario."
              : "Supervisiones que usted ha realizado a este agente."}
          </p>
        </div>
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-800">
            {supervisiones.length}
          </span>{" "}
          {supervisiones.length === 1 ? "supervisión" : "supervisiones"}
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {supervisiones.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            <p className="font-medium text-slate-700">Sin supervisiones</p>
            <p className="mt-1">
              {sesion.rol === "ADMIN"
                ? "Este agente todavía no tiene supervisiones registradas."
                : "Usted todavía no ha realizado supervisiones a este agente."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {supervisiones.map((item) => (
              <Link
                key={item.id}
                href={`/supervisiones/${item.id}`}
                className="block px-5 py-4 transition hover:bg-slate-50 sm:px-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Supervisión del {formatearFecha(item.fecha)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Supervisor:{" "}
                      <span className="font-medium text-slate-700">
                        {item.supervisor.nombre} {item.supervisor.apellido}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:border-0 lg:pt-0">
                    <div className="min-w-20">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Promedio
                      </p>
                      <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                        {Number(item.promedio ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <ClasificacionBadge clasificacion={item.clasificacion} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ClasificacionBadge({
  clasificacion,
}: {
  clasificacion?: string | null;
}) {
  if (!clasificacion) {
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
        Sin clasificación
      </span>
    );
  }

  const estilos: Record<string, string> = {
    CRITICO: "border-red-200 bg-red-50 text-red-700",
    REGULAR: "border-amber-200 bg-amber-50 text-amber-700",
    BUENO: "border-blue-200 bg-blue-50 text-blue-700",
    EXCELENTE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        estilos[clasificacion] ?? "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {etiquetasClasificacion[
        clasificacion as keyof typeof etiquetasClasificacion
      ] ?? clasificacion}
    </span>
  );
}

function ErrorDetalleAgente({ mensaje }: { mensaje: string }) {
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-8">
      <Link
        href="/agentes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
      >
        Volver a agentes
      </Link>
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        <p className="font-semibold">No se pudo mostrar el agente</p>
        <p className="mt-1 text-red-600">{mensaje}</p>
      </div>
    </main>
  );
}
