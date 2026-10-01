import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import { obtenerCatalogoFormulario } from "@/lib/server/catalogo";
import { buscarAgente } from "@/lib/server/agentes";
import { ErrorNegocio } from "@/lib/errores";
import { FormularioSupervision } from "./formulario";

export default async function NuevaSupervisionPage({
  searchParams,
}: {
  searchParams: Promise<{ agenteId?: string }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  const query = await searchParams;
  let agenteInicial: {
    id: number;
    areaOperativaId: number;
  } | null = null;

  if (query.agenteId) {
    try {
      const agente = await buscarAgente(sesion, Number(query.agenteId));
      if (agente.activo) {
        agenteInicial = {
          id: agente.id,
          areaOperativaId: agente.areaOperativaId,
        };
      }
    } catch (error) {
      if (!(error instanceof ErrorNegocio)) {
        throw error;
      }
    }
  }

  let catalogo;

  try {
    catalogo = await obtenerCatalogoFormulario(sesion);
  } catch (error) {
    const mensaje =
      error instanceof ErrorNegocio
        ? error.message
        : "No se pudo cargar el formulario";

    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Nueva supervisión
        </h1>
        <p className="mt-4 text-sm text-red-700">{mensaje}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        Nueva supervisión
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Cada criterio vale lo mismo. El promedio se redondea a dos decimales.
      </p>
      {catalogo.rondas.length === 0 && (
        <p className="mt-4 text-sm text-amber-700">
          No hay rondas. Importá los datos territoriales.
        </p>
      )}
      {catalogo.bloques.length === 0 && (
        <p className="mt-4 text-sm text-amber-700">
          No hay criterios. Ejecutá el seed.
        </p>
      )}
      <FormularioSupervision
        areas={catalogo.areas}
        rondas={catalogo.rondas}
        bloques={catalogo.bloques}
        areaFijaId={catalogo.areaFijaId}
        agenteInicialId={agenteInicial?.id ?? null}
        areaInicialId={
          catalogo.areaFijaId ?? agenteInicial?.areaOperativaId ?? null
        }
      />
    </main>
  );
}
