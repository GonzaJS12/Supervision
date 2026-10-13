"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CerrarSesionBoton } from "./cerrar-sesion";

type SesionNav = {
  nombre: string;
  apellido: string;
  rol: "ADMIN" | "SUPERVISOR";
  areaOperativaNombre: string | null;
};

function linkClass(activo: boolean) {
  return [
    "group flex items-center gap-3 rounded-xl px-3 py-2.5",
    "text-sm font-medium transition",
    activo
      ? "bg-white/10 text-white"
      : "text-slate-400 hover:bg-white/5 hover:text-white",
  ].join(" ");
}

function IconoNav({
  tipo,
}: {
  tipo:
    | "inicio"
    | "agentes"
    | "supervisiones"
    | "nueva"
    | "usuarios"
    | "bloques"
    | "criterios";
}) {
  const comun = "h-[18px] w-[18px] shrink-0";
  if (tipo === "inicio") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    );
  }
  if (tipo === "agentes") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <circle cx="9" cy="8" r="3" />
        <circle cx="16.5" cy="9" r="2.2" />
        <path strokeLinecap="round" d="M4 19v-1a4 4 0 0 1 4-4h2.5a4 4 0 0 1 4 4v1" />
        <path strokeLinecap="round" d="M16 19v-.5a3.5 3.5 0 0 1 2.2-3.2" />
      </svg>
    );
  }
  if (tipo === "supervisiones") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <rect x="6" y="3.5" width="12" height="17" rx="2" />
        <path strokeLinecap="round" d="M9 8h6M9 12h6M9 16h3.5" />
      </svg>
    );
  }
  if (tipo === "nueva") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <path strokeLinecap="round" d="M12 8.5v7M8.5 12h7" />
      </svg>
    );
  }
  if (tipo === "usuarios") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <circle cx="12" cy="8" r="3.2" />
        <path strokeLinecap="round" d="M6 19v-.8A5.2 5.2 0 0 1 11.2 13h1.6A5.2 5.2 0 0 1 18 18.2V19" />
      </svg>
    );
  }
  if (tipo === "bloques") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
        <rect x="4" y="4" width="7" height="7" rx="1.2" />
        <rect x="13" y="4" width="7" height="7" rx="1.2" />
        <rect x="4" y="13" width="7" height="7" rx="1.2" />
        <rect x="13" y="13" width="7" height="7" rx="1.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={comun} aria-hidden>
      <path strokeLinecap="round" d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

export function NavegacionPanel({
  sesion,
  children,
}: {
  sesion: SesionNav;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const esAdmin = sesion.rol === "ADMIN";
  const iniciales =
    `${sesion.nombre?.[0] ?? ""}${sesion.apellido?.[0] ?? ""}`.toUpperCase() ||
    "U";

  function activo(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white shadow-xl shadow-slate-900/20 transition-transform duration-200 ease-out lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5" aria-hidden>
                  <path strokeLinecap="round" d="M12 6v12M6 12h12" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-white">
                  Supervisión
                </p>
                <p className="truncate text-xs text-slate-500">
                  Agentes Sanitarios
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Principal
            </p>
            <div className="space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setAbierto(false)}
                className={linkClass(activo("/dashboard"))}
              >
                <IconoNav tipo="inicio" />
                Inicio
              </Link>
              <Link
                href="/agentes"
                onClick={() => setAbierto(false)}
                className={linkClass(activo("/agentes"))}
              >
                <IconoNav tipo="agentes" />
                Agentes
              </Link>
              <Link
                href="/supervisiones"
                onClick={() => setAbierto(false)}
                className={linkClass(
                  pathname === "/supervisiones" ||
                    /^\/supervisiones\/\d+/.test(pathname),
                )}
              >
                <IconoNav tipo="supervisiones" />
                {esAdmin ? "Supervisiones" : "Mis supervisiones"}
              </Link>
              <Link
                href="/supervisiones/nueva"
                onClick={() => setAbierto(false)}
                className={linkClass(pathname === "/supervisiones/nueva")}
              >
                <IconoNav tipo="nueva" />
                Nueva supervisión
              </Link>
            </div>

            {esAdmin && (
              <div className="mt-7 border-t border-white/5 pt-5">
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Administración
                </p>
                <div className="space-y-1">
                  <Link
                    href="/admin/usuarios"
                    onClick={() => setAbierto(false)}
                    className={linkClass(activo("/admin/usuarios"))}
                  >
                    <IconoNav tipo="usuarios" />
                    Usuarios
                  </Link>
                  <Link
                    href="/admin/bloques"
                    onClick={() => setAbierto(false)}
                    className={linkClass(activo("/admin/bloques"))}
                  >
                    <IconoNav tipo="bloques" />
                    Bloques de evaluación
                  </Link>
                  <Link
                    href="/admin/criterios"
                    onClick={() => setAbierto(false)}
                    className={linkClass(activo("/admin/criterios"))}
                  >
                    <IconoNav tipo="criterios" />
                    Criterios
                  </Link>
                </div>
              </div>
            )}
          </nav>

          <div className="shrink-0 border-t border-white/10 p-3">
            <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-200 ring-1 ring-white/10">
                {iniciales}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {sesion.nombre} {sesion.apellido}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {esAdmin ? "Administrador" : "Supervisor"}
                </p>
              </div>
            </div>
            <CerrarSesionBoton variante="sidebar" />
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
      <header className="sticky top-0 z-30 h-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
              aria-label="Abrir menú"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Sistema de Supervisión
              </h2>
              <p className="hidden truncate text-xs text-slate-500 sm:block">
                Gestión y seguimiento de agentes sanitarios
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {!esAdmin && sesion.areaOperativaNombre && (
              <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right md:block">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Área operativa
                </p>
                <p className="max-w-52 truncate text-xs font-semibold text-slate-700">
                  {sesion.areaOperativaNombre}
                </p>
              </div>
            )}
            <div className="hidden text-right sm:block">
              <p className="max-w-48 truncate text-sm font-semibold text-slate-800">
                {sesion.nombre} {sesion.apellido}
              </p>
              <p className="text-xs text-slate-500">
                {esAdmin ? "Administrador" : "Supervisor"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100 sm:hidden">
              {iniciales}
            </div>
          </div>
        </div>
      </header>
        {children}
      </div>
    </>
  );
}
