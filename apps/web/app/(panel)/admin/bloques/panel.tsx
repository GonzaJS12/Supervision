"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extraerMensajeApi } from "@/lib/mensaje-api";

type Bloque = {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
  criterios: unknown[];
};

export function PanelBloques({ bloques }: { bloques: Bloque[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Bloque | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState("");
  const [guardando, setGuardando] = useState(false);

  function limpiar() {
    setNombre("");
    setDescripcion("");
    setOrden("");
    setEditando(null);
  }

  function abrirNuevo() {
    limpiar();
    setOrden(String(bloques.length + 1));
    setError("");
    setOk("");
    setMostrarFormulario(true);
  }

  function abrirEditar(bloque: Bloque) {
    setEditando(bloque);
    setNombre(bloque.nombre);
    setDescripcion(bloque.descripcion ?? "");
    setOrden(String(bloque.orden));
    setError("");
    setOk("");
    setMostrarFormulario(true);
  }

  async function guardar() {
    setError("");
    setOk("");
    if (!nombre.trim()) {
      setError("El nombre del bloque es obligatorio.");
      return;
    }
    const numeroOrden = Number(orden);
    if (!Number.isInteger(numeroOrden) || numeroOrden < 1) {
      setError("El orden debe ser un número entero mayor o igual a 1.");
      return;
    }

    setGuardando(true);
    const respuesta = await fetch(
      editando ? `/api/v1/bloques/${editando.id}` : "/api/v1/bloques",
      {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          orden: numeroOrden,
        }),
      },
    );
    const datos = (await respuesta.json()) as {
      error?: string;
      message?: string;
    };
    setGuardando(false);
    if (!respuesta.ok) {
      setError(extraerMensajeApi(datos, "No se pudo guardar el bloque."));
      return;
    }
    setOk(
      editando
        ? "Bloque actualizado correctamente."
        : "Bloque creado correctamente.",
    );
    limpiar();
    setMostrarFormulario(false);
    router.refresh();
  }

  async function toggleBloque(bloque: Bloque) {
    const accion = bloque.activo ? "desactivar" : "activar";
    if (
      !window.confirm(
        `¿Está seguro de ${accion} el bloque "${bloque.nombre}"?`,
      )
    ) {
      return;
    }

    const respuesta = await fetch(`/api/v1/bloques/${bloque.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !bloque.activo }),
    });
    const datos = (await respuesta.json()) as {
      error?: string;
      message?: string;
    };
    if (!respuesta.ok) {
      setError(
        extraerMensajeApi(datos, "No se pudo cambiar el estado del bloque."),
      );
      setOk("");
      return;
    }
    setError("");
    setOk(
      bloque.activo
        ? "Bloque desactivado correctamente."
        : "Bloque activado correctamente.",
    );
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Nuevo bloque
        </button>
      </div>

      {ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
          <p className="font-semibold">Operación realizada</p>
          <p className="mt-0.5 text-emerald-600">{ok}</p>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
          <p className="font-semibold">Se produjo un inconveniente</p>
          <p className="mt-0.5 text-red-600">{error}</p>
        </div>
      )}

      {mostrarFormulario && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 className="font-bold text-slate-900 sm:text-lg">
              {editando ? "Editar bloque" : "Nuevo bloque"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editando
                ? "Modifique la información y el orden del bloque seleccionado."
                : "Complete la información para agregar una nueva sección al formulario de evaluación."}
            </p>
          </div>
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_180px]">
            <label className="text-sm font-semibold text-slate-700">
              Nombre <span className="text-red-500">*</span>
              <input
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Ej.: Desempeño en terreno"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Orden <span className="text-red-500">*</span>
              <input
                type="number"
                min={1}
                value={orden}
                onChange={(evento) => setOrden(evento.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 lg:col-span-2">
              Descripción
              <textarea
                rows={3}
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                placeholder="Describa brevemente qué aspectos agrupa este bloque de evaluación..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </label>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end lg:col-span-2">
              <button
                type="button"
                disabled={guardando}
                onClick={() => {
                  limpiar();
                  setMostrarFormulario(false);
                  setError("");
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() => void guardar()}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Crear bloque"}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Estructura de evaluación
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Bloques configurados y cantidad de criterios asociados a cada uno.
            </p>
          </div>
          {bloques.length > 0 && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {bloques.length} {bloques.length === 1 ? "bloque" : "bloques"}
            </span>
          )}
        </div>

        {bloques.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-semibold text-slate-800">
              No hay bloques configurados
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Cree el primer bloque para comenzar a estructurar el formulario
              de supervisión.
            </p>
            <button
              type="button"
              onClick={abrirNuevo}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Nuevo bloque
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="w-24 px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Orden
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Bloque
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Criterios
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bloques.map((bloque) => (
                    <tr key={bloque.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                          {bloque.orden}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {bloque.nombre}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 italic">
                          {bloque.descripcion || "Sin descripción"}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {bloque.criterios.length}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            bloque.activo
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {bloque.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditar(bloque)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleBloque(bloque)}
                            className={
                              bloque.activo
                                ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            }
                          >
                            {bloque.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {bloques.map((bloque) => (
                <li key={bloque.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {bloque.orden}. {bloque.nombre}
                      </p>
                      <p className="text-xs italic text-slate-500">
                        {bloque.descripcion || "Sin descripción"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {bloque.criterios.length}{" "}
                        {bloque.criterios.length === 1
                          ? "criterio"
                          : "criterios"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        bloque.activo
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {bloque.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditar(bloque)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleBloque(bloque)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                    >
                      {bloque.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
