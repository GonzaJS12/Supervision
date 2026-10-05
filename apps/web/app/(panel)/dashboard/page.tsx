import Link from "next/link";
import { obtenerSesion } from "@/lib/sesion";
import { obtenerMetricas } from "@/lib/server/supervisiones";
import {
  etiquetasClasificacion,
  formatearFecha,
  formatearPromedio,
} from "@/lib/etiquetas";
import { BotonExportarPdf } from "../supervisiones/boton-pdf";
import type { Clasificacion } from "@supervision/domain";

export default async function DashboardPage() {
  const sesion = await obtenerSesion();
  let metricas = null;
  let error = "";

  if (sesion) {
    try {
      metricas = await obtenerMetricas(sesion);
    } catch {
      error = "No se pudieron cargar los datos del dashboard.";
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
        Panel de control
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        {sesion?.rol === "ADMIN" ? "Resumen general" : "Mi actividad"}
      </h1>
      <p className="mt-2 text-slate-600">
        {sesion?.rol === "ADMIN"
          ? "Información general sobre agentes y supervisiones registradas en el sistema."
          : "Resumen de las supervisiones que ha realizado y sus resultados."}
      </p>
        </div>
        {sesion?.rol === "SUPERVISOR" && (
          <BotonExportarPdf
            titulo="Reporte de mis supervisiones"
            nombreArchivo="mis-supervisiones"
            etiqueta="Exportar reporte"
            etiquetaCargando="Generando PDF..."
            vacio="No tiene supervisiones para exportar."
            supervisor={`${sesion.nombre} ${sesion.apellido}`}
          />
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-700">{error}</p>
      )}

      {metricas && (
        <div
          className={`mt-6 grid gap-3 sm:grid-cols-2 ${
            sesion?.rol === "ADMIN" ? "xl:grid-cols-5" : "lg:grid-cols-3"
          }`}
        >
          {sesion?.rol === "ADMIN" && (
            <>
              <Tarjeta
                titulo="Agentes"
                valor={String(metricas.totalAgentes ?? 0)}
                detalle="Registrados"
              />
              <Tarjeta
                titulo="Agentes activos"
                valor={String(metricas.totalAgentesActivos ?? 0)}
                detalle="Actualmente activos"
              />
            </>
          )}
          <Tarjeta
            titulo={
              sesion?.rol === "ADMIN"
                ? "Supervisiones"
                : "Mis supervisiones"
            }
            valor={String(metricas.totalSupervisiones)}
            detalle={
              sesion?.rol === "ADMIN"
                ? "Realizadas en total"
                : "Realizadas por usted"
            }
          />
          <Tarjeta
            titulo="Este mes"
            valor={String(metricas.supervisionesMes)}
            detalle={
              sesion?.rol === "ADMIN"
                ? "Supervisiones realizadas"
                : "Sus supervisiones"
            }
          />
          <Tarjeta
            titulo="Promedio general"
            valor={
              metricas.promedioGeneral == null
                ? "-"
                : metricas.promedioGeneral.toFixed(2)
            }
            detalle={
              sesion?.rol === "ADMIN"
                ? "Promedio global"
                : "Promedio de sus evaluaciones"
            }
          />
        </div>
      )}

      {metricas && (
        <section className="mt-6">
          <h2 className="text-lg font-medium text-slate-900">
            Resultados de las supervisiones
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {sesion?.rol === "ADMIN"
              ? "Distribución global de las supervisiones según su clasificación."
              : "Distribución de sus supervisiones según la clasificación obtenida."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {(
              [
                ["CRITICO", "1.0 – 2.5", "border-red-200 bg-red-500"],
                ["REGULAR", "2.6 – 3.5", "border-amber-200 bg-amber-500"],
                ["BUENO", "3.6 – 4.5", "border-blue-200 bg-blue-500"],
                ["EXCELENTE", "4.6 – 5.0", "border-emerald-200 bg-emerald-500"],
              ] as Array<[Clasificacion, string, string]>
            ).map(([clave, rango, fondo]) => (
              <Tarjeta
                key={clave}
                titulo={etiquetasClasificacion[clave]}
                valor={String(metricas.clasificaciones[clave])}
                detalle={rango}
                fondo={fondo}
              />
            ))}
          </div>
          <DistribucionClasificaciones
            critico={metricas.clasificaciones.CRITICO}
            regular={metricas.clasificaciones.REGULAR}
            bueno={metricas.clasificaciones.BUENO}
            excelente={metricas.clasificaciones.EXCELENTE}
          />
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-medium text-slate-900">Accesos rápidos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Acceda a las funciones más utilizadas del sistema.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/supervisiones/nueva"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <p className="font-medium text-slate-900">Nueva supervisión</p>
            <p className="mt-1 text-sm text-slate-500">
              Registrar una nueva evaluación de un agente sanitario.
            </p>
            <p className="mt-4 text-sm font-semibold text-blue-600">
              Abrir →
            </p>
          </Link>
          <Link
            href="/agentes"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <p className="font-medium text-slate-900">Agentes sanitarios</p>
            <p className="mt-1 text-sm text-slate-500">
              Consultar los agentes disponibles y su información territorial.
            </p>
            <p className="mt-4 text-sm font-semibold text-blue-600">
              Abrir →
            </p>
          </Link>
          <Link
            href="/supervisiones"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <p className="font-medium text-slate-900">
              {sesion?.rol === "ADMIN"
                ? "Supervisiones"
                : "Mis supervisiones"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {sesion?.rol === "ADMIN"
                ? "Consultar todas las supervisiones registradas en el sistema."
                : "Consultar el historial de supervisiones que ha realizado."}
            </p>
            <p className="mt-4 text-sm font-semibold text-blue-600">
              Abrir →
            </p>
          </Link>
        </div>
      </section>

      {metricas && (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-slate-900">
                {sesion?.rol === "ADMIN"
                  ? "Últimas supervisiones"
                  : "Mis últimas supervisiones"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {sesion?.rol === "ADMIN"
                  ? "Supervisiones registradas recientemente en el sistema."
                  : "Sus supervisiones realizadas más recientemente."}
              </p>
            </div>
            <Link
              href="/supervisiones"
              className="text-sm font-semibold text-blue-600 underline"
            >
              Ver todas
            </Link>
          </div>
          {metricas.ultimasSupervisiones.length === 0 ? (
            <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              {sesion?.rol === "ADMIN"
                ? "Todavía no hay supervisiones registradas."
                : "Todavía no ha realizado supervisiones."}
            </p>
          ) : (
            <ul className="mt-3 divide-y rounded-xl border border-slate-200 bg-white">
              {metricas.ultimasSupervisiones.map((item) => (
                <li key={item.id} className="px-4 py-3 text-sm">
                  <Link href={`/supervisiones/${item.id}`} className="underline">
                    {item.agenteSanitario.apellido}, {item.agenteSanitario.nombre}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatearFecha(item.fecha)}
                    {item.clasificacion
                      ? ` · ${etiquetasClasificacion[item.clasificacion]}`
                      : " · Sin clasificación"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Área:{" "}
                    <span className="font-medium text-slate-700">
                      {item.areaOperativa.nombre}
                    </span>
                    {sesion?.rol === "ADMIN" &&
                      (() => {
                        const supervisor =
                          "supervisor" in item
                            ? (
                                item as {
                                  supervisor?: {
                                    nombre: string;
                                    apellido: string;
                                  };
                                }
                              ).supervisor
                            : undefined;
                        if (!supervisor) {
                          return null;
                        }
                        return (
                          <>
                            {" · "}Supervisor:{" "}
                            <span className="font-medium text-slate-700">
                              {supervisor.nombre} {supervisor.apellido}
                            </span>
                          </>
                        );
                      })()}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    Promedio{" "}
                    <span className="text-base font-semibold normal-case text-slate-900">
                      {formatearPromedio(item.promedio)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

function Tarjeta({
  titulo,
  valor,
  detalle,
  fondo,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  fondo?: string;
}) {
  const coloreada = Boolean(fondo);

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        fondo ?? "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-xs ${coloreada ? "text-white/80" : "text-slate-500"}`}>
        {titulo}
      </p>
      <p
        className={`mt-1 text-xl font-semibold ${
          coloreada ? "text-white" : "text-slate-900"
        }`}
      >
        {valor}
      </p>
      {detalle && (
        <p className={`mt-1 text-xs ${coloreada ? "text-white/75" : "text-slate-400"}`}>
          {detalle}
        </p>
      )}
    </div>
  );
}

function DistribucionClasificaciones({
  critico,
  regular,
  bueno,
  excelente,
}: {
  critico: number;
  regular: number;
  bueno: number;
  excelente: number;
}) {
  const total = critico + regular + bueno + excelente;
  const porcentaje = (valor: number) =>
    total === 0 ? 0 : (valor / total) * 100;

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">Distribución</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Proporción según clasificación
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          {total} {total === 1 ? "supervisión" : "supervisiones"}
        </p>
      </div>
      {total === 0 ? (
        <div className="h-3 overflow-hidden rounded-full bg-slate-100" />
      ) : (
        <div
          className="flex h-3 overflow-hidden rounded-full bg-slate-100"
          aria-label="Distribución de clasificaciones"
        >
          {critico > 0 && (
            <div
              className="bg-red-500"
              style={{ width: `${porcentaje(critico)}%` }}
              title={`Crítico: ${critico}`}
            />
          )}
          {regular > 0 && (
            <div
              className="bg-amber-500"
              style={{ width: `${porcentaje(regular)}%` }}
              title={`Regular: ${regular}`}
            />
          )}
          {bueno > 0 && (
            <div
              className="bg-blue-500"
              style={{ width: `${porcentaje(bueno)}%` }}
              title={`Bueno: ${bueno}`}
            />
          )}
          {excelente > 0 && (
            <div
              className="bg-emerald-500"
              style={{ width: `${porcentaje(excelente)}%` }}
              title={`Excelente: ${excelente}`}
            />
          )}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Crítico
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Regular
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Bueno
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Excelente
        </span>
      </div>
    </div>
  );
}
