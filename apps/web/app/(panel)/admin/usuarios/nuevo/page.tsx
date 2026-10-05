import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { listarAreasActivas } from "@/lib/server/usuarios";
import { FormularioUsuario } from "./formulario";

export default async function NuevoUsuarioPage() {
  const sesion = await obtenerSesion();

  if (!sesion || sesion.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  let areas: Awaited<ReturnType<typeof listarAreasActivas>> = [];
  let error = "";

  try {
    areas = await listarAreasActivas();
  } catch {
    error = "No se pudieron cargar las áreas operativas.";
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Administración
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Nuevo usuario
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Cree una nueva cuenta y defina el nivel de acceso que tendrá
            dentro del sistema.
          </p>
        </div>
        <Link
          href="/admin/usuarios"
          className="text-sm text-slate-500 underline"
        >
          Volver a usuarios
        </Link>
      </div>
      {error && (
        <p className="mt-4 text-sm text-red-700">{error}</p>
      )}
      <FormularioUsuario areas={areas} />
    </main>
  );
}
