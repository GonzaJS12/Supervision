"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Criterio = {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
};

type Bloque = {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
  criterios: Criterio[];
};

export function PanelEvaluacion({ bloques }: { bloques: Bloque[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function crearBloque(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    const respuesta = await fetch("/api/v1/bloques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.get("nombre"),
        descripcion: form.get("descripcion"),
        orden: Number(form.get("orden")),
      }),
    });
    const datos = (await respuesta.json()) as { error?: string };
    if (!respuesta.ok) {
      setError(datos.error ?? "No se pudo crear el bloque");
      return;
    }
    evento.currentTarget.reset();
    router.refresh();
  }

  async function crearCriterio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    const respuesta = await fetch("/api/v1/criterios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bloqueId: Number(form.get("bloqueId")),
        nombre: form.get("nombre"),
        descripcion: form.get("descripcion"),
        orden: Number(form.get("orden")),
      }),
    });
    const datos = (await respuesta.json()) as { error?: string };
    if (!respuesta.ok) {
      setError(datos.error ?? "No se pudo crear el criterio");
      return;
    }
    evento.currentTarget.reset();
    router.refresh();
  }

  async function toggleBloque(id: number, activo: boolean) {
    await fetch(`/api/v1/bloques/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    router.refresh();
  }

  async function guardarBloque(
    id: number,
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    await fetch(`/api/v1/bloques/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.get("nombre"),
        descripcion: form.get("descripcion"),
        orden: Number(form.get("orden")),
      }),
    });
    router.refresh();
  }

  async function guardarCriterio(
    id: number,
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    await fetch(`/api/v1/criterios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.get("nombre"),
        descripcion: form.get("descripcion"),
        orden: Number(form.get("orden")),
      }),
    });
    router.refresh();
  }

  async function toggleCriterio(id: number, activo: boolean) {
    await fetch(`/api/v1/criterios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-8">
      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={crearBloque} className="flex flex-wrap gap-2">
        <input
          name="nombre"
          required
          placeholder="Nuevo bloque"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          name="descripcion"
          placeholder="Descripción"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          name="orden"
          type="number"
          required
          defaultValue={bloques.length + 1}
          className="w-20 rounded-lg border px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
          Crear bloque
        </button>
      </form>

      <form onSubmit={crearCriterio} className="flex flex-wrap gap-2">
        <select
          name="bloqueId"
          required
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Bloque</option>
          {bloques.map((bloque) => (
            <option key={bloque.id} value={bloque.id}>
              {bloque.nombre}
            </option>
          ))}
        </select>
        <input
          name="nombre"
          required
          placeholder="Nuevo criterio"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          name="orden"
          type="number"
          required
          defaultValue={1}
          className="w-20 rounded-lg border px-3 py-2 text-sm"
        />
        <button className="rounded-lg border px-3 py-2 text-sm">
          Crear criterio
        </button>
      </form>

      {bloques.map((bloque) => (
        <section
          key={bloque.id}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-medium text-slate-900">
                {bloque.orden}. {bloque.nombre}
                {!bloque.activo && (
                  <span className="ml-2 text-xs text-slate-500">
                    (inactivo)
                  </span>
                )}
              </h2>
              {bloque.descripcion && (
                <p className="text-sm text-slate-500">{bloque.descripcion}</p>
              )}
            </div>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => void toggleBloque(bloque.id, bloque.activo)}
            >
              {bloque.activo ? "Desactivar" : "Activar"}
            </button>
          </div>
          <form
            onSubmit={(evento) => void guardarBloque(bloque.id, evento)}
            className="mt-3 flex flex-wrap gap-2"
          >
            <input
              name="nombre"
              defaultValue={bloque.nombre}
              className="rounded border px-2 py-1 text-sm"
            />
            <input
              name="descripcion"
              defaultValue={bloque.descripcion ?? ""}
              className="rounded border px-2 py-1 text-sm"
            />
            <input
              name="orden"
              type="number"
              defaultValue={bloque.orden}
              className="w-16 rounded border px-2 py-1 text-sm"
            />
            <button className="text-sm underline">Guardar bloque</button>
          </form>
          <ul className="mt-3 space-y-2 text-sm">
            {bloque.criterios.map((criterio) => (
              <li
                key={criterio.id}
                className="border-t border-slate-100 pt-2"
              >
                <form
                  onSubmit={(evento) =>
                    void guardarCriterio(criterio.id, evento)
                  }
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    name="nombre"
                    defaultValue={criterio.nombre}
                    className="min-w-48 flex-1 rounded border px-2 py-1"
                  />
                  <input
                    name="orden"
                    type="number"
                    defaultValue={criterio.orden}
                    className="w-16 rounded border px-2 py-1"
                  />
                  <button className="underline">Guardar</button>
                  <button
                    type="button"
                    className="underline"
                    onClick={() =>
                      void toggleCriterio(criterio.id, criterio.activo)
                    }
                  >
                    {criterio.activo ? "Desactivar" : "Activar"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
