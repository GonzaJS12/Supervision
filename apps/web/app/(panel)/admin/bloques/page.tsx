import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { listarBloques } from "@/lib/server/evaluacion";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { PanelBloques } from "./panel";

export default async function BloquesPage() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  let bloques: Awaited<ReturnType<typeof listarBloques>> = [];
  let error = "";

  try {
    bloques = await listarBloques();
  } catch {
    error = "No se pudieron cargar los bloques.";
  }

  const criterios = bloques.flatMap((bloque) => bloque.criterios);
  const activos = bloques.filter((bloque) => bloque.activo).length;

  return (
    <main className="mx-auto max-w-7xl p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
        Configuración
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Bloques de evaluación
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Organice las secciones que componen el formulario de supervisión y
        defina el orden en que serán presentadas.
      </p>
      {error && (
        <p className="mt-4 text-sm text-red-700">{error}</p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaResumen
          titulo="Bloques"
          valor={bloques.length}
          detalle="Configurados"
          estilo="azul"
        />
        <TarjetaResumen
          titulo="Activos"
          valor={activos}
          detalle="Disponibles para evaluar"
          estilo="verde"
        />
        <TarjetaResumen
          titulo="Inactivos"
          valor={bloques.length - activos}
          detalle="Fuera de uso"
          estilo="gris"
        />
        <TarjetaResumen
          titulo="Criterios"
          valor={criterios.length}
          detalle="Asociados a los bloques"
          estilo="violeta"
        />
      </div>
      <PanelBloques bloques={bloques} />
    </main>
  );
}
