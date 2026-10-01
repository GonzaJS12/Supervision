import { prisma } from "@supervision/database";
import { LIMITE_POR_PAGINA } from "@supervision/domain";
import type { SesionUsuario } from "@/lib/auth";
import { ErrorNegocio } from "@/lib/errores";
import { areaDelSupervisor } from "@/lib/server/catalogo";

export async function listarAgentes(params: {
  sesion: SesionUsuario;
  page?: number;
  nombre?: string;
  areaOperativaId?: number;
  sectorId?: number;
}) {
  const pagina =
    params.page && params.page > 0 ? params.page : 1;
  const limite = LIMITE_POR_PAGINA;

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

    if (!usuario?.activo || usuario.areaOperativaId == null) {
      throw new Error(
        "El supervisor no está habilitado o no tiene área asignada",
      );
    }

    where.areaOperativaId = usuario.areaOperativaId;
  } else if (params.areaOperativaId && params.areaOperativaId > 0) {
    where.areaOperativaId = params.areaOperativaId;
  }

  if (params.sectorId && params.sectorId > 0) {
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
          select: { id: true, nombre: true },
        },
        sector: {
          select: { id: true, numero: true, nombre: true },
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
        select: { id: true, nombre: true },
      },
      sector: {
        select: { id: true, numero: true, nombre: true },
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
