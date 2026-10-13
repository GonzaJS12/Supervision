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
      {variante === "sidebar" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-[18px] w-[18px] shrink-0"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5M10 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7"
          />
        </svg>
      )}
      Cerrar sesión
    </button>
  );
}
