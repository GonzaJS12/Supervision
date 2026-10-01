import Link from "next/link";
import { obtenerSesion } from "@/lib/sesion";
import { obtenerMetricas } from "@/lib/server/supervisiones";
import {
  etiquetasClasificacion,
  formatearFecha,
} from "@/lib/etiquetas";
import { BotonExportarPdf } from "../supervisiones/boton-pdf";
import type { Clasificacion } from "@supervision/domain";

export default async function DashboardPage() {
  const sesion = await obtenerSesion();
  const metricas = sesion ? await obtenerMetricas(sesion) : null;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Inicio</h1>
      <p className="mt-2 text-slate-600">
        {sesion?.rol === "ADMIN"
          ? "Resumen general del sistema de supervisión."
          : "Resumen de sus supervisiones realizadas."}
      </p>

      {metricas && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta
            titulo="Supervisiones"
            valor={String(metricas.totalSupervisiones)}
          />
          <Tarjeta
            titulo="Este mes"
            valor={String(metricas.supervisionesMes)}
          />
          <Tarjeta
            titulo="Promedio general"
            valor={
              metricas.promedioGeneral == null
                ? "—"
                : metricas.promedioGeneral.toFixed(2)
            }
          />
          {sesion?.rol === "ADMIN" && (
            <Tarjeta
              titulo="Agentes activos"
              valor={`${metricas.totalAgentesActivos ?? 0} / ${metricas.totalAgentes ?? 0}`}
            />
          )}
        </div>
      )}

      {metricas && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {(
            ["CRITICO", "REGULAR", "BUENO", "EXCELENTE"] as Clasificacion[]
          ).map((clave) => (
            <Tarjeta
              key={clave}
              titulo={etiquetasClasificacion[clave]}
              valor={String(metricas.clasificaciones[clave])}
            />
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/supervisiones/nueva"
          className="rounded-lg bg-slate-900 px-4 py-3 text-sm text-white"
        >
          Nueva supervisión
        </Link>
        <Link
          href="/supervisiones"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
        >
          Ver supervisiones
        </Link>
        <Link
          href="/agentes"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
        >
          Ver agentes
        </Link>
        {sesion && (
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
        )}
      </div>

      {metricas && metricas.ultimasSupervisiones.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-slate-700">Últimas</h2>
          <ul className="mt-3 divide-y rounded-xl border border-slate-200 bg-white">
            {metricas.ultimasSupervisiones.map((item) => (
              <li key={item.id} className="px-4 py-3 text-sm">
                <Link href={`/supervisiones/${item.id}`} className="underline">
                  {item.agenteSanitario.apellido}, {item.agenteSanitario.nombre}
                </Link>
                <span className="text-slate-500">
                  {" "}
                  · {formatearFecha(item.fecha)}
                  {item.clasificacion
                    ? ` · ${etiquetasClasificacion[item.clasificacion]}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{valor}</p>
    </div>
  );
}
