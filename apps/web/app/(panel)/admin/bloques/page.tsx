import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { listarBloques } from "@/lib/server/evaluacion";
import { PanelEvaluacion } from "./panel";

export default async function BloquesPage() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  const bloques = await listarBloques();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        Bloques y criterios
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Lo que desactives deja de usarse en supervisiones nuevas.
        Las ya cargadas conservan el nombre que tenían al guardar.
      </p>
      <PanelEvaluacion bloques={bloques} />
    </main>
  );
}
