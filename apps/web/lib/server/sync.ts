import { Prisma } from "@prisma/client";
import { MAX_PENDIENTES_SYNC } from "@supervision/domain";
import { ErrorNegocio } from "@/lib/errores";
import type { SesionUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  obtenerCatalogoFormulario,
  obtenerTerritorio,
} from "@/lib/server/catalogo";
import {
  crearSupervision,
  listarSupervisiones,
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
  const territorio =
    catalogo.areaFijaId == null
      ? { sectores: [], agentes: [] }
      : await obtenerTerritorio(sesion, catalogo.areaFijaId);
  const historial = await listarSupervisiones(sesion, { page: 1 });

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
    supervisiones: historial.data.map((item) => ({
      id: item.id,
      fecha: item.fecha,
      promedio: item.promedio,
      clasificacion: item.clasificacion,
      decisionGestion: item.decisionGestion,
      agenteSanitario: {
        id: item.agenteSanitario.id,
        nombre: item.agenteSanitario.nombre,
        apellido: item.agenteSanitario.apellido,
      },
    })),
    pulledAt: new Date().toISOString(),
  };
}

export type PendienteSync = DatosCrearSupervision & {
  localId: string;
};

function claveSync(sesionId: number, localId: string) {
  return `sync:${sesionId}:${localId}`.slice(0, 180);
}

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

  if (pendientes.length > MAX_PENDIENTES_SYNC) {
    throw new ErrorNegocio(
      `No se pueden sincronizar más de ${MAX_PENDIENTES_SYNC} supervisiones por envío`,
    );
  }

  const resultados: Array<{
    localId: string;
    ok: boolean;
    remoteId?: number;
    error?: string;
  }> = [];

  for (const pendiente of pendientes) {
    const claveIdempotencia = claveSync(sesion.id, pendiente.localId);

    try {
      const existente = await prisma.supervision.findUnique({
        where: { claveIdempotencia },
        select: { id: true },
      });

      if (existente) {
        resultados.push({
          localId: pendiente.localId,
          ok: true,
          remoteId: existente.id,
        });
        continue;
      }

      const creada = await crearSupervision(sesion, {
        ...pendiente,
        claveIdempotencia,
      });
      resultados.push({
        localId: pendiente.localId,
        ok: true,
        remoteId: creada.id,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existente = await prisma.supervision.findUnique({
          where: { claveIdempotencia },
          select: { id: true },
        });

        if (existente) {
          resultados.push({
            localId: pendiente.localId,
            ok: true,
            remoteId: existente.id,
          });
          continue;
        }
      }

      resultados.push({
        localId: pendiente.localId,
        ok: false,
        error:
          error instanceof ErrorNegocio
            ? error.message
            : "No se pudo sincronizar",
      });
    }
  }

  return resultados;
}
