import { prisma } from "@supervision/database";
import type { SesionUsuario } from "@/lib/auth";
import { ErrorNegocio } from "@/lib/errores";

export async function areaDelSupervisor(
  sesion: SesionUsuario,
): Promise<number | null> {
  if (sesion.rol !== "SUPERVISOR") {
    return null;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.id },
    select: { activo: true, areaOperativaId: true },
  });

  if (!usuario?.activo || usuario.areaOperativaId == null) {
    throw new ErrorNegocio(
      "El supervisor no está habilitado o no tiene área asignada",
      403,
    );
  }

  return usuario.areaOperativaId;
}

export async function asegurarAreaPermitida(
  sesion: SesionUsuario,
  areaOperativaId: number,
) {
  const areaSupervisor = await areaDelSupervisor(sesion);

  if (
    areaSupervisor != null &&
    areaSupervisor !== areaOperativaId
  ) {
    throw new ErrorNegocio(
      "No tiene permiso para consultar otra área operativa",
      403,
    );
  }
}

export async function obtenerCatalogoFormulario(
  sesion: SesionUsuario,
) {
  const areaSupervisor = await areaDelSupervisor(sesion);

  const [areas, rondas, bloques] = await Promise.all([
    prisma.areaOperativa.findMany({
      where: {
        activo: true,
        ...(areaSupervisor != null
          ? { id: areaSupervisor }
          : {}),
      },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.ronda.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.bloqueEvaluacion.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        orden: true,
        criterios: {
          where: { activo: true },
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            orden: true,
          },
          orderBy: { orden: "asc" },
        },
      },
      orderBy: { orden: "asc" },
    }),
  ]);

  return {
    areas,
    rondas,
    bloques,
    areaFijaId: areaSupervisor,
  };
}

export async function obtenerTerritorio(
  sesion: SesionUsuario,
  areaOperativaId: number,
) {
  await asegurarAreaPermitida(sesion, areaOperativaId);

  const area = await prisma.areaOperativa.findUnique({
    where: { id: areaOperativaId },
  });

  if (!area?.activo) {
    throw new ErrorNegocio(
      "El área operativa no existe o está inactiva",
      404,
    );
  }

  const [sectores, agentes] = await Promise.all([
    prisma.sector.findMany({
      where: { areaOperativaId, activo: true },
      select: {
        id: true,
        numero: true,
        nombre: true,
      },
      orderBy: { numero: "asc" },
    }),
    prisma.agenteSanitario.findMany({
      where: { areaOperativaId, activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        sectorId: true,
        areaOperativaId: true,
        cobertura: true,
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
  ]);

  return { sectores, agentes };
}

export async function listarZonasActivas() {
  return prisma.zona.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      codigo: true,
    },
    orderBy: { nombre: "asc" },
  });
}

export async function listarRondasActivas() {
  return prisma.ronda.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      externalRondaId: true,
    },
    orderBy: { externalRondaId: "desc" },
  });
}

export async function listarAreasParaUsuario(sesion: SesionUsuario) {
  const areaSupervisor = await areaDelSupervisor(sesion);

  return prisma.areaOperativa.findMany({
    where: {
      activo: true,
      ...(areaSupervisor != null ? { id: areaSupervisor } : {}),
    },
    select: {
      id: true,
      nombre: true,
      zona: { select: { id: true, nombre: true } },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function listarSectoresParaUsuario(
  sesion: SesionUsuario,
  areaOperativaId?: number,
) {
  if (areaOperativaId) {
    await asegurarAreaPermitida(sesion, areaOperativaId);
  }

  const areaSupervisor = await areaDelSupervisor(sesion);
  const areaId = areaSupervisor ?? areaOperativaId;

  return prisma.sector.findMany({
    where: {
      activo: true,
      ...(areaId ? { areaOperativaId: areaId } : {}),
    },
    include: {
      areaOperativa: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: [{ areaOperativaId: "asc" }, { numero: "asc" }],
  });
}

export async function listarBloquesActivos() {
  return prisma.bloqueEvaluacion.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    include: {
      criterios: {
        where: { activo: true },
        orderBy: { orden: "asc" },
      },
    },
  });
}
