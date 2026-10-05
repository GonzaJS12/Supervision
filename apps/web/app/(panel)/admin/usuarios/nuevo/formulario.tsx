"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { extraerMensajeApi } from "@/lib/mensaje-api";
import { CampoPassword } from "@/components/campo-password";

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
    const password = String(form.get("password") ?? "");
    const confirmar = String(form.get("confirmarPassword") ?? "");

    const nombre = String(form.get("nombre") ?? "").trim();
    const apellido = String(form.get("apellido") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const areaOperativaId = String(form.get("areaOperativaId") ?? "");

    if (!nombre || !apellido || !email || !password) {
      setError("Complete todos los campos obligatorios.");
      setCargando(false);
      return;
    }

    if (rol === "SUPERVISOR" && !areaOperativaId) {
      setError("Seleccione el área operativa del supervisor.");
      setCargando(false);
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setCargando(false);
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      setCargando(false);
      return;
    }

    const respuesta = await fetch("/api/v1/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        apellido,
        email: email.toLowerCase(),
        password,
        rol,
        ...(rol === "SUPERVISOR"
          ? { areaOperativaId: Number(areaOperativaId) }
          : {}),
      }),
    });

    const datos = (await respuesta.json()) as {
      error?: string;
      message?: string | string[];
    };

    if (!respuesta.ok) {
      setError(extraerMensajeApi(datos, "No se pudo crear el usuario."));
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
          <p className="font-semibold">No se pudo crear el usuario</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      <p className="text-sm font-medium text-slate-900">Datos personales</p>
      <label className="block text-sm">
        Nombre
        <input
          name="nombre"
          required
          placeholder="Ingrese el nombre"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Apellido
        <input
          name="apellido"
          required
          placeholder="Ingrese el apellido"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Correo electrónico
        <p className="text-xs font-normal text-slate-500">
          Se utilizará para iniciar sesión en el sistema.
        </p>
        <input
          name="email"
          type="email"
          required
          placeholder="usuario@correo.com"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <p className="text-sm font-medium text-slate-900">Acceso y permisos</p>
      <label className="block text-sm">
        Rol
        <select
          value={rol}
          onChange={(e) =>
            setRol(e.target.value as "ADMIN" | "SUPERVISOR")
          }
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          <option value="SUPERVISOR">Supervisor</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </label>

      {rol === "SUPERVISOR" ? (
        <label className="block text-sm">
          Área operativa
          <select
            name="areaOperativaId"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
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
          <label className="block text-sm">
            Área operativa
            <div className="mt-1 flex min-h-[42px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-500">
              No corresponde para administradores
            </div>
          </label>
        )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          {rol === "SUPERVISOR"
            ? "Cuenta de supervisor"
            : "Cuenta de administrador"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {rol === "SUPERVISOR"
            ? "El supervisor quedará asociado al área operativa seleccionada y trabajará dentro de ese ámbito territorial."
            : "El administrador tendrá acceso a las funciones administrativas del sistema y no requiere un área operativa asignada."}
        </p>
      </div>

      <p className="text-sm font-medium text-slate-900">
        Seguridad de la cuenta
      </p>
      <p className="text-xs text-slate-500">
        Defina la contraseña inicial que utilizará el usuario. La contraseña
        debe contener al menos 8 caracteres. Ambos campos deben coincidir
        antes de crear la cuenta.
      </p>
      <CampoPassword
        label="Contraseña"
        name="password"
        required
        minLength={8}
        placeholder="Mínimo 8 caracteres"
        autoComplete="new-password"
        className="mt-1 w-full rounded-lg border px-3 py-2 pr-24"
      />
      <CampoPassword
        label="Confirmar contraseña"
        name="confirmarPassword"
        required
        minLength={8}
        placeholder="Repita la contraseña"
        autoComplete="new-password"
        className="mt-1 w-full rounded-lg border px-3 py-2 pr-24"
      />
      <p className="text-xs text-slate-400">
        Los campos marcados con * son obligatorios.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/usuarios")}
          disabled={cargando}
          className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {cargando ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
