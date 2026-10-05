"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extraerMensajeApi } from "@/lib/mensaje-api";

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
  activo: boolean;
  criterios: Criterio[];
};

export function PanelCriterios({ bloques }: { bloques: Bloque[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [filtroBloque, setFiltroBloque] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<{
    criterio: Criterio;
    bloqueId: number;
  } | null>(null);
  const [bloqueId, setBloqueId] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState("1");
  const [guardando, setGuardando] = useState(false);

  const bloquesVisibles = filtroBloque
    ? bloques.filter((bloque) => String(bloque.id) === filtroBloque)
    : bloques;
  const criteriosVisibles = bloquesVisibles.flatMap((bloque) =>
    bloque.criterios.map((criterio) => ({ criterio, bloque })),
  );
  const nombreBloqueFiltrado =
    bloques.find((bloque) => String(bloque.id) === filtroBloque)?.nombre ??
    "";

  function limpiar() {
    setEditando(null);
    setBloqueId("");
    setNombre("");
    setDescripcion("");
    setOrden("1");
  }

  function abrirNuevo() {
    limpiar();
    setError("");
    setOk("");
    setMostrarFormulario(true);
  }

  function abrirEditar(criterio: Criterio, idBloque: number) {
    setEditando({ criterio, bloqueId: idBloque });
    setBloqueId(String(idBloque));
    setNombre(criterio.nombre);
    setDescripcion(criterio.descripcion ?? "");
    setOrden(String(criterio.orden));
    setError("");
    setOk("");
    setMostrarFormulario(true);
  }

  async function guardar() {
    setError("");
    setOk("");
    const idBloque = Number(bloqueId);
    const numeroOrden = Number(orden);
    if (!Number.isInteger(idBloque) || idBloque < 1) {
      setError("Debe seleccionar un bloque.");
      return;
    }
    if (!nombre.trim()) {
      setError("El nombre del criterio es obligatorio.");
      return;
    }
    if (!Number.isInteger(numeroOrden) || numeroOrden < 1) {
      setError("El orden debe ser un número entero mayor o igual a 1.");
      return;
    }

    setGuardando(true);
    const respuesta = await fetch(
      editando
        ? `/api/v1/criterios/${editando.criterio.id}`
        : "/api/v1/criterios",
      {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloqueId: idBloque,
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
      setError(extraerMensajeApi(datos, "No se pudo guardar el criterio."));
      return;
    }
    setOk(
      editando
        ? "Criterio actualizado correctamente."
        : "Criterio creado correctamente.",
    );
    limpiar();
    setMostrarFormulario(false);
    router.refresh();
  }

  async function toggleCriterio(criterio: Criterio) {
    const accion = criterio.activo ? "desactivar" : "activar";
    if (
      !window.confirm(
        `¿Está seguro de ${accion} el criterio "${criterio.nombre}"?`,
      )
    ) {
      return;
    }

    const respuesta = await fetch(`/api/v1/criterios/${criterio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !criterio.activo }),
    });
    const datos = (await respuesta.json()) as {
      error?: string;
      message?: string;
    };
    if (!respuesta.ok) {
      setError(
        extraerMensajeApi(
          datos,
          "No se pudo cambiar el estado del criterio.",
        ),
      );
      setOk("");
      return;
    }
    setError("");
    setOk(
      criterio.activo
        ? "Criterio desactivado correctamente."
        : "Criterio activado correctamente.",
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
          Nuevo criterio
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
          <div className="border-b border-slate-100 px-5 py-5">
            <h2 className="font-bold text-slate-900 sm:text-lg">
              {editando ? "Editar criterio" : "Nuevo criterio"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editando
                ? "Modifique la información y ubicación del criterio seleccionado."
                : "Defina el criterio y seleccione el bloque de evaluación al que pertenecerá."}
            </p>
          </div>
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Bloque <span className="text-red-500">*</span>
              <select
                value={bloqueId}
                onChange={(evento) => setBloqueId(evento.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="">Seleccione un bloque</option>
                {bloques
                  .filter((bloque) => bloque.activo)
                  .map((bloque) => (
                    <option key={bloque.id} value={bloque.id}>
                      {bloque.nombre}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Orden <span className="text-red-500">*</span>
              <input
                type="number"
                min={1}
                value={orden}
                onChange={(evento) => setOrden(evento.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 lg:col-span-2">
              Nombre del criterio <span className="text-red-500">*</span>
              <input
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Ej.: Verifica correctamente la información de la familia"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 lg:col-span-2">
              Descripción
              <textarea
                rows={3}
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                placeholder="Detalle brevemente qué debe observar el supervisor..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
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
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
                    : "Crear criterio"}
              </button>
            </div>
          </div>
        </section>
      )}

      <div>
        <p className="text-sm font-medium text-slate-900">Filtrar criterios</p>
        <p className="text-xs text-slate-500">
          Visualice los criterios pertenecientes a un bloque específico.
        </p>
      </div>
      <label className="block text-sm text-slate-600">
        Bloque de evaluación
        <select
          value={filtroBloque}
          onChange={(evento) => setFiltroBloque(evento.target.value)}
          className="mt-1 rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Todos los bloques</option>
          {bloques.map((bloque) => (
            <option key={bloque.id} value={bloque.id}>
              {bloque.nombre}
            </option>
          ))}
        </select>
      </label>
      {filtroBloque ? (
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          onClick={() => setFiltroBloque("")}
        >
          Limpiar filtro
        </button>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Estructura de criterios
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtroBloque
                ? `Mostrando criterios de ${nombreBloqueFiltrado}.`
                : "Todos los criterios configurados para las supervisiones."}
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {criteriosVisibles.length}{" "}
            {criteriosVisibles.length === 1 ? "criterio" : "criterios"}
          </span>
        </div>

        {criteriosVisibles.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-semibold text-slate-800">
              {filtroBloque
                ? "No hay criterios en este bloque"
                : "No hay criterios configurados"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {filtroBloque
                ? "El bloque seleccionado no contiene criterios o no hay criterios disponibles para mostrar."
                : "Cree el primer criterio para comenzar a definir los aspectos que serán evaluados durante las supervisiones."}
            </p>
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
                      Criterio
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Bloque
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
                  {criteriosVisibles.map(({ criterio, bloque }) => (
                    <tr key={criterio.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                          {criterio.orden}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {criterio.nombre}
                        </p>
                        <p className="mt-1 text-xs italic text-slate-500">
                          {criterio.descripcion || "Sin descripción"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {bloque.nombre}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            criterio.activo
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {criterio.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditar(criterio, bloque.id)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleCriterio(criterio)}
                            className={
                              criterio.activo
                                ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            }
                          >
                            {criterio.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {criteriosVisibles.map(({ criterio, bloque }) => (
                <li key={criterio.id} className="space-y-3 p-4">
                  <p className="font-semibold text-slate-800">
                    {criterio.orden}. {criterio.nombre}
                  </p>
                  <p className="text-xs text-slate-500">{bloque.nombre}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditar(criterio, bloque.id)}
                      className="rounded-lg border px-3 py-2 text-xs font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleCriterio(criterio)}
                      className="rounded-lg border px-3 py-2 text-xs font-semibold"
                    >
                      {criterio.activo ? "Desactivar" : "Activar"}
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
