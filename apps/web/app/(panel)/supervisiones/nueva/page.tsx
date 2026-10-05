import Link from "next/link";
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
        : "No se pudieron cargar los datos del formulario.";

    return (
      <main className="mx-auto max-w-5xl p-8">
        <Link
          href="/supervisiones"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
        >
          Volver al historial
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          Evaluación sanitaria
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Nueva supervisión
        </h1>
        <p className="mt-4 text-sm text-red-700">{mensaje}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link
        href="/supervisiones"
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
      >
        Volver al historial
      </Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
        Evaluación sanitaria
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        Nueva supervisión
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Complete los datos del agente, evalúe todos los criterios y registre
        las observaciones de la supervisión.
      </p>
      <FormularioSupervision
        areas={catalogo.areas}
        rondas={catalogo.rondas}
        bloques={catalogo.bloques}
        areaFijaId={catalogo.areaFijaId}
        esSupervisor={sesion.rol === "SUPERVISOR"}
        agenteInicialId={agenteInicial?.id ?? null}
        areaInicialId={
          catalogo.areaFijaId ?? agenteInicial?.areaOperativaId ?? null
        }
      />
    </main>
  );
}
