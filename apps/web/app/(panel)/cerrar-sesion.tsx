"use client";

import { useRouter } from "next/navigation";

export function CerrarSesionBoton({
  variante = "default",
}: {
  variante?: "default" | "sidebar";
}) {
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
      className={
        variante === "sidebar"
          ? "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          : "text-slate-600 hover:text-slate-900"
      }
    >
      Cerrar sesión
    </button>
  );
}
