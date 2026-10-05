import { prisma } from "@supervision/database";
import { LIMITE_POR_PAGINA } from "@supervision/domain";
import type { SesionUsuario } from "@/lib/auth";
import { ErrorNegocio } from "@/lib/errores";
import { areaDelSupervisor, asegurarAreaPermitida } from "@/lib/server/catalogo";

export async function listarAgentes(params: {
  sesion: SesionUsuario;
  page?: number;
  limit?: number;
  nombre?: string;
  areaOperativaId?: number;
  sectorId?: number;
}) {
  const paginaRaw = params.page ?? 1;
  const pagina =
    Number.isInteger(paginaRaw) && paginaRaw > 0 ? paginaRaw : 1;
  const limiteRaw = params.limit ?? LIMITE_POR_PAGINA;
  const limite =
    Number.isInteger(limiteRaw) && limiteRaw > 0
      ? Math.min(limiteRaw, LIMITE_POR_PAGINA)
      : LIMITE_POR_PAGINA;

  const where: {
    OR?: Array<{
      nombre?: { contains: string; mode: "insensitive" };
      apellido?: { contains: string; mode: "insensitive" };
    }>;
    areaOperativaId?: number;
    sectorId?: number;
  } = {};

  const nombre = params.nombre?.trim();

  if (nombre) {
    where.OR = [
      { nombre: { contains: nombre, mode: "insensitive" } },
      { apellido: { contains: nombre, mode: "insensitive" } },
    ];
  }

  if (params.sesion.rol === "SUPERVISOR") {
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.sesion.id },
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

    where.areaOperativaId = usuario.areaOperativaId;
  } else if (
    params.areaOperativaId !== undefined &&
    Number.isInteger(params.areaOperativaId) &&
    params.areaOperativaId > 0
  ) {
    where.areaOperativaId = params.areaOperativaId;
  }

  if (
    params.sectorId !== undefined &&
    Number.isInteger(params.sectorId) &&
    params.sectorId > 0
  ) {
    where.sectorId = params.sectorId;
  }

  const [total, agentes] = await prisma.$transaction([
    prisma.agenteSanitario.count({ where }),
    prisma.agenteSanitario.findMany({
      where,
      skip: (pagina - 1) * limite,
      take: limite,
      include: {
        areaOperativa: {
          select: {
            id: true,
            externalAreaId: true,
            nombre: true,
          },
        },
        sector: {
          select: {
            id: true,
            externalSectorId: true,
            numero: true,
            nombre: true,
          },
        },
      },
      orderBy: [
        { activo: "desc" },
        { apellido: "asc" },
        { nombre: "asc" },
      ],
    }),
  ]);

  return {
    data: agentes,
    meta: {
      page: pagina,
      limit: limite,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limite),
    },
  };
}

export async function buscarAgente(
  sesion: SesionUsuario,
  id: number,
) {
  const agente = await prisma.agenteSanitario.findUnique({
    where: { id },
    include: {
      areaOperativa: {
        select: {
          id: true,
          externalAreaId: true,
          nombre: true,
        },
      },
      sector: {
        select: {
          id: true,
          externalSectorId: true,
          numero: true,
          nombre: true,
        },
      },
    },
  });

  if (!agente) {
    throw new ErrorNegocio("El agente sanitario no existe", 404);
  }

  if (sesion.rol === "SUPERVISOR") {
    const areaSupervisor = await areaDelSupervisor(sesion);

    if (agente.areaOperativaId !== areaSupervisor) {
      throw new ErrorNegocio("El agente sanitario no existe", 404);
    }
  }

  return agente;
}

export async function listarSectoresParaFiltro(
  sesion: SesionUsuario,
  areaOperativaId?: number,
) {
  let areaId = areaOperativaId;

  if (sesion.rol === "SUPERVISOR") {
    const areaSupervisor = await areaDelSupervisor(sesion);
    areaId = areaSupervisor ?? undefined;
  }

  if (!areaId) {
    return [];
  }

  return prisma.sector.findMany({
    where: { areaOperativaId: areaId, activo: true },
    select: { id: true, numero: true, nombre: true },
    orderBy: { numero: "asc" },
  });
}

export async function listarAgentesPorArea(
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

  return prisma.agenteSanitario.findMany({
    where: { areaOperativaId, activo: true },
    include: {
      sector: {
        select: {
          id: true,
          externalSectorId: true,
          numero: true,
          nombre: true,
        },
      },
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
}
