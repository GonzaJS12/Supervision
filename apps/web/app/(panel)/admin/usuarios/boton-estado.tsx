"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BotonEstado({
  id,
  activo,
  nombre,
  apellido,
}: {
  id: number;
  activo: boolean;
  nombre?: string;
  apellido?: string;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function cambiar() {
    const accion = activo ? "desactivar" : "activar";
    const etiqueta =
      nombre && apellido ? `${nombre} ${apellido}` : "este usuario";
    if (
      !window.confirm(
        `¿Está seguro de ${accion} al usuario ${etiqueta}?`,
      )
    ) {
      return;
    }

    setCargando(true);
    setError("");
    setOk("");
    const respuesta = await fetch(`/api/v1/usuarios/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    const datos = (await respuesta.json()) as {
      error?: string;
      message?: string;
    };
    if (!respuesta.ok) {
      setError(
        datos.error ??
          datos.message ??
          "No se pudo cambiar el estado del usuario.",
      );
      setCargando(false);
      return;
    }
    setOk(
      activo
        ? "Usuario desactivado correctamente."
        : "Usuario activado correctamente.",
    );
    router.refresh();
    setCargando(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={cambiar}
        disabled={cargando}
        className="text-slate-600 underline"
      >
        {activo ? "Desactivar usuario" : "Activar usuario"}
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      {ok && <p className="mt-1 text-xs text-emerald-700">{ok}</p>}
    </div>
  );
}
