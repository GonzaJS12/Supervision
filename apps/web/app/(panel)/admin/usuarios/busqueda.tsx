"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export function BusquedaUsuarios({ valor }: { valor: string }) {
  const router = useRouter();
  const debounce = useRef<number | null>(null);

  function buscar(texto: string) {
    const q = texto.trim();
    const destino = q
      ? `/admin/usuarios?q=${encodeURIComponent(q)}`
      : "/admin/usuarios";
    router.replace(destino);
  }

  return (
    <div className="mt-6 space-y-3">
      <div>
        <h2 className="font-medium text-slate-900">Buscar usuarios</h2>
        <p className="text-xs text-slate-500">
          Filtre por nombre, apellido o correo. Se muestran 15 por página.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="q-usuarios"
          >
            Usuario
          </label>
          <input
            id="q-usuarios"
            name="q"
            type="search"
            autoComplete="off"
            defaultValue={valor}
            placeholder="Nombre, apellido o email"
            className="mt-1 block w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            onChange={(evento) => {
              if (debounce.current) {
                window.clearTimeout(debounce.current);
              }
              const texto = evento.target.value;
              debounce.current = window.setTimeout(() => {
                buscar(texto);
              }, 400);
            }}
          />
        </div>
        {valor ? (
          <Link
            href="/admin/usuarios"
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Limpiar búsqueda
          </Link>
        ) : null}
      </div>
    </div>
  );
}
