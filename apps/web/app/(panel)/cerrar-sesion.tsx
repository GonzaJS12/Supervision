"use client";

import { useRouter } from "next/navigation";

export function CerrarSesionBoton() {
  const router = useRouter();

  async function salir() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={salir}
      className="text-slate-600 hover:text-slate-900"
    >
      Cerrar sesión
    </button>
  );
}
