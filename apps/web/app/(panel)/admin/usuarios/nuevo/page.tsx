import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { listarAreasActivas } from "@/lib/server/usuarios";
import { FormularioUsuario } from "./formulario";

export default async function NuevoUsuarioPage() {
  const sesion = await obtenerSesion();

  if (!sesion || sesion.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  const areas = await listarAreasActivas();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        Nuevo usuario
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Un supervisor necesita un área operativa asignada.
        {areas.length === 0
          ? " Todavía no hay áreas: importá los datos territoriales."
          : ""}
      </p>
      <FormularioUsuario areas={areas} />
    </main>
  );
}
