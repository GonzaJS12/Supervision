import { Prisma } from "@prisma/client";
import { prisma } from "@supervision/database";
import {
  calcularClasificacion,
  calcularPromedio,
  hayCriteriosDuplicados,
  LIMITE_POR_PAGINA,
  type Clasificacion,
  type DecisionGestion,
} from "@supervision/domain";
import type { SesionUsuario } from "@/lib/auth";
import { ErrorNegocio } from "@/lib/errores";
import { buscarAgente } from "@/lib/server/agentes";

const decisiones: DecisionGestion[] = [
  "NO_REQUIERE",
  "SEGUIMIENTO",
  "CAPACITACION",
  "SUPERVISION_INTENSIVA",
];

const clasificaciones: Clasificacion[] = [
  "CRITICO",
  "REGULAR",
  "BUENO",
  "EXCELENTE",
];

const includeListado = {
  agenteSanitario: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      documento: true,
      legajo: true,
    },
  },
  supervisor: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
    },
  },
  areaOperativa: {
    select: { id: true, nombre: true },
  },
  sector: {
    select: { id: true, numero: true, nombre: true },
  },
  ronda: {
    select: { id: true, nombre: true },
  },
} as const;

function serializarSupervision<T extends { promedio: unknown }>(
  supervision: T,
) {
  return {
    ...supervision,
    promedio:
      supervision.promedio == null
        ? null
        : Number(supervision.promedio),
  };
}

export type DatosCrearSupervision = {
  agenteSanitarioId: number;
  areaOperativaId: number;
  sectorId?: number | null;
  rondaId: number;
  fecha: string;
  familiaNumero?: number | null;
  decisionGestion: DecisionGestion;
  fortalezas?: string | null;
  oportunidadesMejora?: string | null;
  situacionesCriticas?: string | null;
  recomendaciones?: string | null;
  evaluaciones: Array<{ criterioId: number; puntuacion: number }>;
};

export async function crearSupervision(
  sesion: SesionUsuario,
  dto: DatosCrearSupervision,
) {
  const supervisor = await prisma.usuario.findUnique({
    where: { id: sesion.id },
  });

  if (!supervisor?.activo) {
    throw new ErrorNegocio(
      "El supervisor no existe o está inactivo",
      404,
    );
  }

  if (
    supervisor.rol === "SUPERVISOR" &&
    supervisor.areaOperativaId == null
  ) {
    throw new ErrorNegocio(
      "El supervisor no tiene un área operativa asignada",
      403,
    );
  }

  const agente = await prisma.agenteSanitario.findUnique({
    where: { id: dto.agenteSanitarioId },
  });

  if (!agente) {
    throw new ErrorNegocio("El agente sanitario no existe", 404);
  }

  if (!agente.activo) {
    throw new ErrorNegocio(
      "No se puede crear una supervisión para un agente inactivo",
    );
  }

  if (
    supervisor.rol === "SUPERVISOR" &&
    agente.areaOperativaId !== supervisor.areaOperativaId
  ) {
    throw new ErrorNegocio(
      "No puede supervisar un agente de otra área operativa",
      403,
    );
  }

  const areaOperativaId =
    supervisor.rol === "SUPERVISOR"
      ? supervisor.areaOperativaId!
      : dto.areaOperativaId;

  const area = await prisma.areaOperativa.findUnique({
    where: { id: areaOperativaId },
  });

  if (!area?.activo) {
    throw new ErrorNegocio(
      "El área operativa no existe o está inactiva",
      404,
    );
  }

  if (agente.areaOperativaId !== areaOperativaId) {
    throw new ErrorNegocio(
      "El agente sanitario no pertenece al área operativa seleccionada",
    );
  }

  const ronda = await prisma.ronda.findUnique({
    where: { id: dto.rondaId },
  });

  if (!ronda?.activo) {
    throw new ErrorNegocio("La ronda no existe o está inactiva", 404);
  }

  const sectorId = dto.sectorId ?? null;

  if (agente.sectorId !== sectorId) {
    if (agente.sectorId === null) {
      throw new ErrorNegocio(
        "El agente sanitario no tiene un sector asignado",
      );
    }

    throw new ErrorNegocio(
      "El sector seleccionado no corresponde al sector del agente sanitario",
    );
  }

  if (sectorId !== null) {
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
    });

    if (!sector?.activo) {
      throw new ErrorNegocio("El sector no existe o está inactivo", 404);
    }

    if (sector.areaOperativaId !== areaOperativaId) {
      throw new ErrorNegocio(
        "El sector no pertenece al área operativa seleccionada",
      );
    }
  }

  if (!dto.evaluaciones?.length) {
    throw new ErrorNegocio(
      "La supervisión debe tener al menos una evaluación",
    );
  }

  const criterioIds = dto.evaluaciones.map((item) => item.criterioId);

  if (hayCriteriosDuplicados(criterioIds)) {
    throw new ErrorNegocio(
      "No se puede evaluar el mismo criterio más de una vez",
    );
  }

  if (!decisiones.includes(dto.decisionGestion)) {
    throw new ErrorNegocio("La decisión de gestión no es válida");
  }

  const criterios = await prisma.criterioEvaluacion.findMany({
    where: { id: { in: criterioIds }, activo: true },
  });

  if (criterios.length !== criterioIds.length) {
    throw new ErrorNegocio(
      "Uno o más criterios no existen o están inactivos",
    );
  }

  const promedioRedondeado = calcularPromedio(
    dto.evaluaciones.map((item) => item.puntuacion),
  );
  const clasificacion = calcularClasificacion(promedioRedondeado);
  const fecha = new Date(dto.fecha);

  if (Number.isNaN(fecha.getTime())) {
    throw new ErrorNegocio("La fecha no es válida");
  }

  const supervision = await prisma.supervision.create({
    data: {
      agenteSanitarioId: dto.agenteSanitarioId,
      supervisorId: sesion.id,
      areaOperativaId,
      sectorId,
      rondaId: dto.rondaId,
      fecha,
      familiaNumero: dto.familiaNumero ?? null,
      decisionGestion: dto.decisionGestion,
      promedio: new Prisma.Decimal(promedioRedondeado),
      clasificacion,
      fortalezas: dto.fortalezas || null,
      oportunidadesMejora: dto.oportunidadesMejora || null,
      situacionesCriticas: dto.situacionesCriticas || null,
      recomendaciones: dto.recomendaciones || null,
      evaluaciones: {
        create: dto.evaluaciones.map((evaluacion) => {
          const criterio = criterios.find(
            (item) => item.id === evaluacion.criterioId,
          )!;

          return {
            criterioId: evaluacion.criterioId,
            criterioNombre: criterio.nombre,
            criterioDescripcion: criterio.descripcion,
            puntuacion: evaluacion.puntuacion,
          };
        }),
      },
    },
    include: {
      ...includeListado,
      evaluaciones: { orderBy: { id: "asc" } },
    },
  });

  return serializarSupervision(supervision);
}

function construirFiltros(params: {
  fechaDesde?: string;
  fechaHasta?: string;
  clasificacion?: string;
}): Prisma.SupervisionWhereInput {
  const where: Prisma.SupervisionWhereInput = {};
  const clasificacion = params.clasificacion?.trim().toUpperCase();

  if (clasificacion) {
    if (!clasificaciones.includes(clasificacion as Clasificacion)) {
      throw new ErrorNegocio("La clasificación enviada no es válida");
    }

    where.clasificacion = clasificacion as Clasificacion;
  }

  let desde: Date | undefined;
  let hasta: Date | undefined;

  if (params.fechaDesde) {
    desde = new Date(`${params.fechaDesde}T00:00:00`);
    if (Number.isNaN(desde.getTime())) {
      throw new ErrorNegocio("La fecha desde no es válida");
    }
  }

  if (params.fechaHasta) {
    hasta = new Date(`${params.fechaHasta}T00:00:00`);
    if (Number.isNaN(hasta.getTime())) {
      throw new ErrorNegocio("La fecha hasta no es válida");
    }
  }

  if (desde && hasta && desde.getTime() > hasta.getTime()) {
    throw new ErrorNegocio(
      "La fecha desde no puede ser posterior a la fecha hasta",
    );
  }

  if (desde || hasta) {
    const filtroFecha: Prisma.DateTimeFilter = {};
    if (desde) {
      filtroFecha.gte = desde;
    }
    if (hasta) {
      const diaSiguiente = new Date(hasta);
      diaSiguiente.setDate(diaSiguiente.getDate() + 1);
      filtroFecha.lt = diaSiguiente;
    }
    where.fecha = filtroFecha;
  }

  return where;
}

export async function listarSupervisiones(
  sesion: SesionUsuario,
  params: {
    page?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    clasificacion?: string;
  },
) {
  const pagina =
    params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const limite = LIMITE_POR_PAGINA;
  const where = construirFiltros(params);

  if (sesion.rol === "SUPERVISOR") {
    where.supervisorId = sesion.id;
  }

  const [data, total] = await Promise.all([
    prisma.supervision.findMany({
      where,
      skip: (pagina - 1) * limite,
      take: limite,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      include: includeListado,
    }),
    prisma.supervision.count({ where }),
  ]);

  return {
    data: data.map(serializarSupervision),
    meta: {
      page: pagina,
      limit: limite,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limite),
    },
  };
}

export async function buscarSupervision(
  sesion: SesionUsuario,
  id: number,
) {
  const supervision = await prisma.supervision.findFirst({
    where: {
      id,
      ...(sesion.rol === "SUPERVISOR"
        ? { supervisorId: sesion.id }
        : {}),
    },
    include: {
      ...includeListado,
      evaluaciones: { orderBy: { id: "asc" } },
    },
  });

  if (!supervision) {
    throw new ErrorNegocio(
      "La supervisión no existe o no tiene acceso a ella",
      404,
    );
  }

  return serializarSupervision(supervision);
}

export async function listarSupervisionesPorAgente(
  sesion: SesionUsuario,
  agenteSanitarioId: number,
) {
  await buscarAgente(sesion, agenteSanitarioId);

  const data = await prisma.supervision.findMany({
    where: {
      agenteSanitarioId,
      ...(sesion.rol === "SUPERVISOR"
        ? { supervisorId: sesion.id }
        : {}),
    },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    include: includeListado,
  });

  return data.map(serializarSupervision);
}

export async function listarParaExportacion(sesion: SesionUsuario) {
  const data = await prisma.supervision.findMany({
    where:
      sesion.rol === "SUPERVISOR"
        ? { supervisorId: sesion.id }
        : undefined,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    include: includeListado,
  });

  return data.map(serializarSupervision);
}

function cantidadClasificacion(
  datos: Array<{
    clasificacion: Clasificacion | null;
    _count: { _all: number };
  }>,
  clasificacion: Clasificacion,
) {
  return (
    datos.find((item) => item.clasificacion === clasificacion)?._count
      ._all ?? 0
  );
}

export async function obtenerMetricas(sesion: SesionUsuario) {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const filtroSupervisor =
    sesion.rol === "SUPERVISOR"
      ? { supervisorId: sesion.id }
      : {};

  const [
    totalAgentes,
    totalAgentesActivos,
    totalSupervisiones,
    supervisionesMes,
    promedio,
    porClasificacion,
    ultimasSupervisiones,
  ] = await Promise.all([
    sesion.rol === "ADMIN"
      ? prisma.agenteSanitario.count()
      : Promise.resolve(null),
    sesion.rol === "ADMIN"
      ? prisma.agenteSanitario.count({ where: { activo: true } })
      : Promise.resolve(null),
    prisma.supervision.count({ where: filtroSupervisor }),
    prisma.supervision.count({
      where: { ...filtroSupervisor, fecha: { gte: inicioMes } },
    }),
    prisma.supervision.aggregate({
      where: filtroSupervisor,
      _avg: { promedio: true },
    }),
    prisma.supervision.groupBy({
      by: ["clasificacion"],
      where: filtroSupervisor,
      _count: { _all: true },
    }),
    prisma.supervision.findMany({
      where: filtroSupervisor,
      take: 10,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      include: includeListado,
    }),
  ]);

  return {
    totalAgentes,
    totalAgentesActivos,
    totalSupervisiones,
    supervisionesMes,
    promedioGeneral: promedio._avg.promedio
      ? Number(promedio._avg.promedio)
      : null,
    clasificaciones: {
      CRITICO: cantidadClasificacion(porClasificacion, "CRITICO"),
      REGULAR: cantidadClasificacion(porClasificacion, "REGULAR"),
      BUENO: cantidadClasificacion(porClasificacion, "BUENO"),
      EXCELENTE: cantidadClasificacion(porClasificacion, "EXCELENTE"),
    },
    ultimasSupervisiones: ultimasSupervisiones.map(serializarSupervision),
  };
}
