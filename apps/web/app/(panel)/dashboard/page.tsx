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

  const esAdmin = sesion?.rol === "ADMIN";

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Panel de control
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            {esAdmin ? "Resumen general" : "Mi actividad"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {esAdmin
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
          className={`mt-6 grid gap-4 sm:grid-cols-2 ${
            esAdmin ? "xl:grid-cols-5" : "lg:grid-cols-3"
          }`}
        >
          {esAdmin && (
            <>
              <TarjetaKpi
                titulo="Agentes"
                valor={String(metricas.totalAgentes ?? 0)}
                detalle="Registrados"
                tono="azul"
                icono="agentes"
              />
              <TarjetaKpi
                titulo="Agentes activos"
                valor={String(metricas.totalAgentesActivos ?? 0)}
                detalle="Actualmente activos"
                tono="celeste"
                icono="activos"
              />
            </>
          )}
          <TarjetaKpi
            titulo={esAdmin ? "Supervisiones" : "Mis supervisiones"}
            valor={String(metricas.totalSupervisiones)}
            detalle={esAdmin ? "Realizadas en total" : "Realizadas por usted"}
            tono="violeta"
            icono="lista"
          />
          <TarjetaKpi
            titulo="Este mes"
            valor={String(metricas.supervisionesMes)}
            detalle={esAdmin ? "Supervisiones realizadas" : "Sus supervisiones"}
            tono="indigo"
            icono="calendario"
          />
          <TarjetaKpi
            titulo="Promedio general"
            valor={
              metricas.promedioGeneral == null
                ? "-"
                : metricas.promedioGeneral.toFixed(2)
            }
            detalle={esAdmin ? "Promedio global" : "Promedio de sus evaluaciones"}
            tono="verde"
            icono="grafico"
          />
        </div>
      )}

      {metricas && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Resultados de las supervisiones
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {esAdmin
              ? "Distribución global de las supervisiones según su clasificación."
              : "Distribución de sus supervisiones según la clasificación obtenida."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["CRITICO", "1.0 – 2.5", "bg-red-500", "bg-red-50"],
                ["REGULAR", "2.6 – 3.5", "bg-amber-500", "bg-amber-50"],
                ["BUENO", "3.6 – 4.5", "bg-blue-500", "bg-blue-50"],
                ["EXCELENTE", "4.6 – 5.0", "bg-emerald-500", "bg-emerald-50"],
              ] as Array<[Clasificacion, string, string, string]>
            ).map(([clave, rango, punto, fondo]) => (
              <div
                key={clave}
                className={`rounded-2xl ${fondo} px-4 py-4`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${punto}`} />
                  <p className="text-sm font-semibold text-slate-700">
                    {etiquetasClasificacion[clave]}
                  </p>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {metricas.clasificaciones[clave]}
                </p>
                <p className="mt-1 text-xs text-slate-400">{rango}</p>
              </div>
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
        <h2 className="text-lg font-semibold text-slate-900">Accesos rápidos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Acceda a las funciones más utilizadas del sistema.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AccesoRapido
            href="/supervisiones/nueva"
            titulo="Nueva supervisión"
            detalle="Registrar una nueva evaluación de un agente sanitario."
            icono="nueva"
          />
          <AccesoRapido
            href="/agentes"
            titulo="Agentes sanitarios"
            detalle="Consultar los agentes disponibles y su información territorial."
            icono="agentes"
          />
          <AccesoRapido
            href="/supervisiones"
            titulo={esAdmin ? "Supervisiones" : "Mis supervisiones"}
            detalle={
              esAdmin
                ? "Consultar todas las supervisiones registradas en el sistema."
                : "Consultar el historial de supervisiones que ha realizado."
            }
            icono="lista"
          />
        </div>
      </section>

      {metricas && (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {esAdmin
                  ? "Últimas supervisiones"
                  : "Mis últimas supervisiones"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {esAdmin
                  ? "Supervisiones registradas recientemente en el sistema."
                  : "Sus supervisiones realizadas más recientemente."}
              </p>
            </div>
            <Link
              href="/supervisiones"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todas
            </Link>
          </div>
          {metricas.ultimasSupervisiones.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              {esAdmin
                ? "Todavía no hay supervisiones registradas."
                : "Todavía no ha realizado supervisiones."}
            </p>
          ) : (
            <ul className="mt-4 divide-y rounded-2xl border border-slate-200 bg-white">
              {metricas.ultimasSupervisiones.map((item) => (
                <li key={item.id} className="px-5 py-4 text-sm">
                  <Link
                    href={`/supervisiones/${item.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600"
                  >
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
                    {esAdmin &&
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
    </div>
  );
}

function Icono({
  tipo,
}: {
  tipo: "agentes" | "activos" | "lista" | "calendario" | "grafico" | "nueva";
}) {
  const comun = "h-5 w-5";
  if (tipo === "agentes") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <path strokeLinecap="round" d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3" />
        <path strokeLinecap="round" d="M20 8v6M17 11h6" />
      </svg>
    );
  }
  if (tipo === "activos") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (tipo === "lista") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <path strokeLinecap="round" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
      </svg>
    );
  }
  if (tipo === "calendario") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  if (tipo === "nueva") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v8M8 12h8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
      <path strokeLinecap="round" d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </svg>
  );
}

function TarjetaKpi({
  titulo,
  valor,
  detalle,
  tono,
  icono,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  tono: "azul" | "celeste" | "violeta" | "indigo" | "verde";
  icono: "agentes" | "activos" | "lista" | "calendario" | "grafico";
}) {
  const color = {
    azul: "bg-blue-50 text-blue-600",
    celeste: "bg-sky-50 text-sky-600",
    violeta: "bg-violet-50 text-violet-600",
    indigo: "bg-indigo-50 text-indigo-600",
    verde: "bg-emerald-50 text-emerald-600",
  }[tono];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {valor}
          </p>
          <p className="mt-1 text-xs text-slate-400">{detalle}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${color}`}
        >
          <Icono tipo={icono} />
        </div>
      </div>
    </div>
  );
}

function AccesoRapido({
  href,
  titulo,
  detalle,
  icono,
}: {
  href: string;
  titulo: string;
  detalle: string;
  icono: "nueva" | "agentes" | "lista";
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icono tipo={icono} />
      </div>
      <p className="mt-4 font-semibold text-slate-900">{titulo}</p>
      <p className="mt-1 text-sm text-slate-500">{detalle}</p>
    </Link>
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
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" />
      ) : (
        <div
          className="flex h-2.5 overflow-hidden rounded-full bg-slate-100"
          aria-label="Distribución de clasificaciones"
        >
          {critico > 0 && (
            <div
              className="bg-red-500"
              style={{ width: `${porcentaje(critico)}%` }}
            />
          )}
          {regular > 0 && (
            <div
              className="bg-amber-500"
              style={{ width: `${porcentaje(regular)}%` }}
            />
          )}
          {bueno > 0 && (
            <div
              className="bg-blue-500"
              style={{ width: `${porcentaje(bueno)}%` }}
            />
          )}
          {excelente > 0 && (
            <div
              className="bg-emerald-500"
              style={{ width: `${porcentaje(excelente)}%` }}
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
