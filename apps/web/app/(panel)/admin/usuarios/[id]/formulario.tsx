"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Area = { id: number; nombre: string };

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: "ADMIN" | "SUPERVISOR";
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

  async function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setOk("");
    setCargando(true);
    const form = new FormData(evento.currentTarget);

    const respuesta = await fetch(`/api/v1/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.get("nombre"),
        apellido: form.get("apellido"),
        email: form.get("email"),
        areaOperativaId:
          usuario.rol === "SUPERVISOR"
            ? Number(form.get("areaOperativaId"))
            : null,
      }),
    });

    const datos = (await respuesta.json()) as { error?: string };

    if (!respuesta.ok) {
      setError(datos.error ?? "No se pudo guardar");
      setCargando(false);
      return;
    }

    setOk("Datos actualizados");
    setCargando(false);
    router.refresh();
  }

  async function onPassword(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setOk("");
    const form = new FormData(evento.currentTarget);
    const password = String(form.get("password") ?? "");

    const respuesta = await fetch(
      `/api/v1/usuarios/${usuario.id}/password`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );

    const datos = (await respuesta.json()) as { error?: string };

    if (!respuesta.ok) {
      setError(datos.error ?? "No se pudo cambiar la contraseña");
      return;
    }

    setOk("Contraseña actualizada");
    evento.currentTarget.reset();
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
        <input
          name="nombre"
          required
          defaultValue={usuario.nombre}
          className="w-full rounded-lg border px-3 py-2"
        />
        <input
          name="apellido"
          required
          defaultValue={usuario.apellido}
          className="w-full rounded-lg border px-3 py-2"
        />
        <input
          name="email"
          type="email"
          required
          defaultValue={usuario.email}
          className="w-full rounded-lg border px-3 py-2"
        />
        {usuario.rol === "SUPERVISOR" && (
          <select
            name="areaOperativaId"
            required
            defaultValue={usuario.areaOperativaId ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Área operativa</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={cargando}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Guardar
        </button>
      </form>

      <form onSubmit={onPassword} className="space-y-4">
        <h2 className="font-medium text-slate-900">Nueva contraseña</h2>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="w-full rounded-lg border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cambiar contraseña
        </button>
      </form>
    </div>
  );
}
