"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BotonEstado({
  id,
  activo,
}: {
  id: number;
  activo: boolean;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function cambiar() {
    setCargando(true);
    await fetch(`/api/v1/usuarios/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    router.refresh();
    setCargando(false);
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      disabled={cargando}
      className="text-slate-600 underline"
    >
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}
