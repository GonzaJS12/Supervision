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
    select: { activo: true, areaOperativaId: true, rol: true },
  });

    if (!usuario || !usuario.activo) {
      throw new ErrorNegocio("El usuario no está habilitado", 403);
    }

  if (usuario.rol !== "SUPERVISOR") {
    throw new ErrorNegocio("El usuario no es supervisor", 403);
  }

  if (usuario.areaOperativaId == null) {
    throw new ErrorNegocio(
      "El supervisor no tiene un área operativa asignada",
      403,
    );
  }

  return usuario.areaOperativaId;
}

export async function areaDelSupervisorParaSectores(
  sesion: SesionUsuario,
): Promise<number | null> {
  if (sesion.rol !== "SUPERVISOR") {
    return null;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.id },
    select: { activo: true, areaOperativaId: true, rol: true },
  });

  if (!usuario || !usuario.activo) {
    throw new ErrorNegocio("El usuario no existe o está inactivo", 404);
  }

  if (usuario.rol !== "SUPERVISOR") {
    throw new ErrorNegocio("El usuario no es supervisor", 403);
  }

  if (usuario.areaOperativaId === null) {
    throw new ErrorNegocio(
      "El supervisor no tiene un área operativa asignada",
      403,
    );
  }

  return usuario.areaOperativaId;
}

export async function asegurarAreaPermitida(
  sesion: SesionUsuario,
  areaOperativaId: number,
  recurso: "agentes" | "sectores" | "area" = "area",
) {
  const areaSupervisor = await areaDelSupervisor(sesion);

  if (
    areaSupervisor != null &&
    areaSupervisor !== areaOperativaId
  ) {
    const mensajes = {
      agentes:
        "No tiene permiso para consultar agentes de otra área operativa",
      sectores:
        "No puede consultar sectores de otra área operativa",
      area: "No tiene permiso para consultar otra área operativa",
    };

    throw new ErrorNegocio(mensajes[recurso], 403);
  }
}

export async function obtenerCatalogoFormulario(
  sesion: SesionUsuario,
) {
  let areaSupervisor: number | null = null;

  if (sesion.rol === "SUPERVISOR") {
    const usuario = await prisma.usuario.findUnique({
      where: { id: sesion.id },
      select: { activo: true, areaOperativaId: true, rol: true },
    });

    if (!usuario || !usuario.activo) {
      throw new ErrorNegocio("El usuario no está habilitado", 403);
    }

    if (usuario.rol !== "SUPERVISOR") {
      throw new ErrorNegocio("El usuario no es supervisor", 403);
    }

    areaSupervisor = usuario.areaOperativaId;
  }

  const [areas, rondas, bloques] = await Promise.all([
    prisma.areaOperativa.findMany({
      where: {
        activo: true,
        ...(areaSupervisor != null
          ? { id: areaSupervisor }
          : sesion.rol === "SUPERVISOR"
            ? { id: { in: [] } }
            : {}),
      },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.ronda.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { externalRondaId: "desc" },
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
  await asegurarAreaPermitida(sesion, areaOperativaId, "agentes");

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
        documento: true,
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
    orderBy: { nombre: "asc" },
  });
}

export async function listarRondasActivas() {
  return prisma.ronda.findMany({
    where: { activo: true },
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
    include: {
      zona: true,
    },
    orderBy: { nombre: "asc" },
  });
}

export async function listarSectoresPorArea(
  sesion: SesionUsuario,
  areaOperativaId: number,
) {
  const areaSupervisor = await areaDelSupervisorParaSectores(sesion);

  if (areaSupervisor != null && areaOperativaId !== areaSupervisor) {
    throw new ErrorNegocio(
      "No puede consultar sectores de otra área operativa",
      403,
    );
  }

  const area = await prisma.areaOperativa.findUnique({
    where: { id: areaOperativaId },
  });

  if (!area || !area.activo) {
    throw new ErrorNegocio(
      "El área operativa no existe o está inactiva",
      404,
    );
  }

  return prisma.sector.findMany({
    where: { areaOperativaId, activo: true },
    orderBy: { numero: "asc" },
  });
}

export async function listarSectoresParaUsuario(sesion: SesionUsuario) {
  const areaSupervisor = await areaDelSupervisorParaSectores(sesion);

  return prisma.sector.findMany({
    where: {
      activo: true,
      ...(areaSupervisor != null ? { areaOperativaId: areaSupervisor } : {}),
    },
    include: {
      areaOperativa: {
        select: { id: true, externalAreaId: true, nombre: true },
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
