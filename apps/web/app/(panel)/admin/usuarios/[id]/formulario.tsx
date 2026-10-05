"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { extraerMensajeApi } from "@/lib/mensaje-api";
import { CampoPassword } from "@/components/campo-password";

type Area = { id: number; nombre: string };

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: "ADMIN" | "SUPERVISOR";
  activo: boolean;
  areaOperativaId: number | null;
};

export function FormularioEditarUsuario({
  usuario,
  areas,
}: {
  usuario: Usuario;
  areas: Area[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  async function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setOk("");
    setCargando(true);
    const form = new FormData(evento.currentTarget);
    const nombre = String(form.get("nombre") ?? "").trim();
    const apellido = String(form.get("apellido") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const areaOperativaId = String(form.get("areaOperativaId") ?? "");

    if (!nombre || !apellido || !email) {
      setError("Complete nombre, apellido y email.");
      setCargando(false);
      return;
    }

    if (usuario.rol === "SUPERVISOR" && !areaOperativaId) {
      setError("Seleccione un área operativa.");
      setCargando(false);
      return;
    }

    const respuesta = await fetch(`/api/v1/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        apellido,
        email,
        areaOperativaId:
          usuario.rol === "SUPERVISOR" ? Number(areaOperativaId) : undefined,
      }),
    });

    const datos = (await respuesta.json()) as {
      error?: string;
      message?: string | string[];
    };

    if (!respuesta.ok) {
      setError(
        extraerMensajeApi(datos, "No se pudo modificar el usuario."),
      );
      setCargando(false);
      return;
    }

    setOk("Usuario actualizado correctamente.");
    setCargando(false);
    router.refresh();
  }

  async function onPassword(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setOk("");
    const formulario = evento.currentTarget;
    const form = new FormData(formulario);
    const password = String(form.get("password") ?? "");
    const confirmar = String(form.get("confirmarPassword") ?? "");

    if (!password.trim()) {
      setError("Ingrese una nueva contraseña.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCambiandoPassword(true);
    const respuesta = await fetch(
      `/api/v1/usuarios/${usuario.id}/password`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );

    const datos = (await respuesta.json()) as {
      error?: string;
      message?: string;
    };

    if (!respuesta.ok) {
      setError(
        extraerMensajeApi(datos, "No se pudo cambiar la contraseña."),
      );
      setCambiandoPassword(false);
      return;
    }

    setOk("Contraseña actualizada correctamente.");
    formulario.reset();
    setMostrarPassword(false);
    setCambiandoPassword(false);
  }

  async function onEstado() {
    const accion = usuario.activo ? "desactivar" : "activar";
    if (
      !window.confirm(
        `¿Está seguro de ${accion} al usuario ${usuario.nombre} ${usuario.apellido}?`,
      )
    ) {
      return;
    }

    setError("");
    setOk("");
    setCambiandoEstado(true);
    const respuesta = await fetch(`/api/v1/usuarios/${usuario.id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !usuario.activo }),
    });
    const datos = (await respuesta.json()) as {
      error?: string;
      message?: string;
    };
    if (!respuesta.ok) {
      setError(
        extraerMensajeApi(datos, "No se pudo cambiar el estado del usuario."),
      );
      setCambiandoEstado(false);
      return;
    }
    setOk(
      usuario.activo
        ? "Usuario desactivado correctamente."
        : "Usuario activado correctamente.",
    );
    setCambiandoEstado(false);
    router.refresh();
  }

  return (
    <div className="mt-6 max-w-md space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {ok}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">
          Datos del usuario
        </h2>
        <p className="text-sm text-slate-500">
          El rol del usuario no puede modificarse.
        </p>
        <label className="block text-sm font-medium text-slate-700">
          Nombre
          <input
            name="nombre"
            required
            defaultValue={usuario.nombre}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Apellido
          <input
            name="apellido"
            required
            defaultValue={usuario.apellido}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            name="email"
            type="email"
            required
            defaultValue={usuario.email}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Rol
          <div className="mt-1 flex min-h-[42px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
            {usuario.rol === "ADMIN" ? (
              <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                Administrador
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Supervisor
              </span>
            )}
          </div>
        </label>
        {usuario.rol === "SUPERVISOR" ? (
          <label className="block text-sm font-medium text-slate-700">
            Área operativa
            <select
              name="areaOperativaId"
              required
              defaultValue={usuario.areaOperativaId ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
            >
              <option value="">Seleccione un área</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block text-sm font-medium text-slate-700">
            Área operativa
            <div className="mt-1 flex min-h-[42px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-500">
              No corresponde
            </div>
          </label>
        )}
        <label className="block text-sm font-medium text-slate-700">
          Estado
          <div className="mt-1 flex min-h-[42px] items-center">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                usuario.activo
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {usuario.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </label>
        <button
          type="submit"
          disabled={cargando || cambiandoEstado || cambiandoPassword}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-800">Administración</h2>
        <p className="text-sm text-slate-500">
          Administración de contraseña y estado de la cuenta.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={cargando || cambiandoPassword || cambiandoEstado}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setMostrarPassword((actual) => !actual);
              setError("");
              setOk("");
            }}
          >
            {mostrarPassword ? "Cancelar cambio" : "Cambiar contraseña"}
          </button>
          {usuario.activo ? (
            <button
              type="button"
              onClick={onEstado}
              disabled={cargando || cambiandoEstado || cambiandoPassword}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cambiandoEstado ? "Desactivando..." : "Desactivar usuario"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onEstado}
              disabled={cargando || cambiandoEstado || cambiandoPassword}
              className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cambiandoEstado ? "Activando..." : "Activar usuario"}
            </button>
          )}
        </div>
        {mostrarPassword && (
          <form onSubmit={onPassword} className="space-y-4">
            <h3 className="font-semibold text-slate-800">Cambiar contraseña</h3>
            <p className="text-sm text-slate-500">
              Ingrese la nueva contraseña para {usuario.nombre}{" "}
              {usuario.apellido}.
            </p>
            <CampoPassword
              label="Nueva contraseña"
              name="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border px-3 py-2 pr-24 font-normal"
            />
            <CampoPassword
              label="Confirmar contraseña"
              name="confirmarPassword"
              required
              minLength={8}
              placeholder="Repita la contraseña"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border px-3 py-2 pr-24 font-normal"
            />
            <button
              type="submit"
              disabled={cambiandoPassword}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              {cambiandoPassword ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
