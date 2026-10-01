"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Area = { id: number; nombre: string };

export function FormularioUsuario({ areas }: { areas: Area[] }) {
  const router = useRouter();
  const [rol, setRol] = useState<"ADMIN" | "SUPERVISOR">("SUPERVISOR");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    const form = new FormData(evento.currentTarget);

    const respuesta = await fetch("/api/v1/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.get("nombre"),
        apellido: form.get("apellido"),
        email: form.get("email"),
        password: form.get("password"),
        rol,
        areaOperativaId:
          rol === "SUPERVISOR"
            ? Number(form.get("areaOperativaId"))
            : null,
      }),
    });

    const datos = (await respuesta.json()) as { error?: string };

    if (!respuesta.ok) {
      setError(datos.error ?? "No se pudo crear el usuario");
      setCargando(false);
      return;
    }

    router.push("/admin/usuarios");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <input
        name="nombre"
        required
        placeholder="Nombre"
        className="w-full rounded-lg border px-3 py-2"
      />
      <input
        name="apellido"
        required
        placeholder="Apellido"
        className="w-full rounded-lg border px-3 py-2"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full rounded-lg border px-3 py-2"
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder="Contraseña (mín. 8)"
        className="w-full rounded-lg border px-3 py-2"
      />

      <select
        value={rol}
        onChange={(e) =>
          setRol(e.target.value as "ADMIN" | "SUPERVISOR")
        }
        className="w-full rounded-lg border px-3 py-2"
      >
        <option value="SUPERVISOR">Supervisor</option>
        <option value="ADMIN">Administrador</option>
      </select>

      {rol === "SUPERVISOR" && (
        <select
          name="areaOperativaId"
          required
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
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {cargando ? "Guardando..." : "Crear usuario"}
      </button>
    </form>
  );
}
