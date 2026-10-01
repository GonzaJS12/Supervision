import { ErrorNegocio } from "@/lib/errores";
import type { SesionUsuario } from "@/lib/auth";
import {
  obtenerCatalogoFormulario,
  obtenerTerritorio,
} from "@/lib/server/catalogo";
import {
  crearSupervision,
  type DatosCrearSupervision,
} from "@/lib/server/supervisiones";

export async function obtenerPaqueteSync(sesion: SesionUsuario) {
  if (sesion.rol !== "SUPERVISOR") {
    throw new ErrorNegocio(
      "La app de campo es solo para supervisores",
      403,
    );
  }

  const catalogo = await obtenerCatalogoFormulario(sesion);

  if (catalogo.areaFijaId == null) {
    throw new ErrorNegocio(
      "El supervisor no tiene un área operativa asignada",
      403,
    );
  }

  const territorio = await obtenerTerritorio(sesion, catalogo.areaFijaId);

  return {
    usuario: {
      id: sesion.id,
      nombre: sesion.nombre,
      apellido: sesion.apellido,
      email: sesion.email,
      rol: sesion.rol,
      areaOperativaId: catalogo.areaFijaId,
    },
    areas: catalogo.areas,
    rondas: catalogo.rondas,
    bloques: catalogo.bloques,
    sectores: territorio.sectores,
    agentes: territorio.agentes,
    pulledAt: new Date().toISOString(),
  };
}

export type PendienteSync = DatosCrearSupervision & {
  localId: string;
};

export async function empujarPendientes(
  sesion: SesionUsuario,
  pendientes: PendienteSync[],
) {
  if (sesion.rol !== "SUPERVISOR") {
    throw new ErrorNegocio(
      "La app de campo es solo para supervisores",
      403,
    );
  }

  const resultados: Array<{
    localId: string;
    ok: boolean;
    remoteId?: number;
    error?: string;
  }> = [];

  for (const pendiente of pendientes) {
    try {
      const creada = await crearSupervision(sesion, pendiente);
      resultados.push({
        localId: pendiente.localId,
        ok: true,
        remoteId: creada.id,
      });
    } catch (error) {
      resultados.push({
        localId: pendiente.localId,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo sincronizar",
      });
    }
  }

  return resultados;
}
