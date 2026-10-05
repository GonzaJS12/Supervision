import { prisma } from "@supervision/database";
import { ErrorNegocio } from "@/lib/errores";

export async function listarBloques() {
  return prisma.bloqueEvaluacion.findMany({
    orderBy: { orden: "asc" },
    include: {
      criterios: { orderBy: { orden: "asc" } },
    },
  });
}

export async function buscarBloque(id: number) {
  const bloque = await prisma.bloqueEvaluacion.findUnique({
    where: { id },
    include: {
      criterios: { orderBy: { orden: "asc" } },
    },
  });

  if (!bloque) {
    throw new ErrorNegocio("El bloque de evaluación no existe", 404);
  }

  return bloque;
}

export async function listarCriterios() {
  return prisma.criterioEvaluacion.findMany({
    orderBy: [{ bloque: { orden: "asc" } }, { orden: "asc" }],
    include: { bloque: true },
  });
}

export async function listarCriteriosPorBloque(bloqueId: number) {
  return prisma.criterioEvaluacion.findMany({
    where: { bloqueId },
    orderBy: { orden: "asc" },
  });
}

export async function buscarCriterio(id: number) {
  const criterio = await prisma.criterioEvaluacion.findUnique({
    where: { id },
    include: { bloque: true },
  });

  if (!criterio) {
    throw new ErrorNegocio("El criterio de evaluación no existe", 404);
  }

  return criterio;
}

export async function crearBloque(datos: {
  nombre: string;
  descripcion?: string | null;
  orden: number;
}) {
  const nombre = datos.nombre;
  if (!Number.isInteger(datos.orden) || datos.orden < 1) {
    throw new ErrorNegocio("El orden debe ser un entero mayor a 0");
  }
  const existente = await prisma.bloqueEvaluacion.findUnique({
    where: { nombre },
  });

  if (existente) {
    throw new ErrorNegocio("Ya existe un bloque con ese nombre", 409);
  }

  return prisma.bloqueEvaluacion.create({
    data: {
      nombre,
      descripcion: datos.descripcion,
      orden: datos.orden,
    },
  });
}

export async function actualizarBloque(
  id: number,
  datos: {
    nombre?: string;
    descripcion?: string | null;
    orden?: number;
    activo?: boolean;
  },
) {
  const bloque = await prisma.bloqueEvaluacion.findUnique({
    where: { id },
  });

  if (!bloque) {
    throw new ErrorNegocio("El bloque de evaluación no existe", 404);
  }

  if (datos.nombre !== undefined) {
    const existente = await prisma.bloqueEvaluacion.findFirst({
      where: { nombre: datos.nombre, NOT: { id } },
    });

    if (existente) {
      throw new ErrorNegocio("Ya existe otro bloque con ese nombre", 409);
    }
  }

  if (
    datos.orden !== undefined &&
    (!Number.isInteger(datos.orden) || datos.orden < 1)
  ) {
    throw new ErrorNegocio("El orden debe ser un entero mayor a 0");
  }

  return prisma.bloqueEvaluacion.update({
    where: { id },
    data: {
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.descripcion !== undefined
        ? { descripcion: datos.descripcion }
        : {}),
      ...(datos.orden !== undefined ? { orden: datos.orden } : {}),
      ...(datos.activo !== undefined ? { activo: datos.activo } : {}),
    },
  });
}

export async function crearCriterio(datos: {
  bloqueId: number;
  nombre: string;
  descripcion?: string | null;
  orden: number;
}) {
  if (!Number.isInteger(datos.orden) || datos.orden < 1) {
    throw new ErrorNegocio("El orden debe ser un entero mayor a 0");
  }

  const bloque = await prisma.bloqueEvaluacion.findUnique({
    where: { id: datos.bloqueId },
  });

  if (!bloque) {
    throw new ErrorNegocio("El bloque de evaluación no existe", 404);
  }

  return prisma.criterioEvaluacion.create({
    data: {
      bloqueId: datos.bloqueId,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      orden: datos.orden,
    },
  });
}

export async function actualizarCriterio(
  id: number,
  datos: {
    bloqueId?: number;
    nombre?: string;
    descripcion?: string | null;
    orden?: number;
    activo?: boolean;
  },
) {
  const criterio = await prisma.criterioEvaluacion.findUnique({
    where: { id },
  });

  if (!criterio) {
    throw new ErrorNegocio("El criterio de evaluación no existe", 404);
  }

  if (datos.bloqueId) {
    const bloque = await prisma.bloqueEvaluacion.findUnique({
      where: { id: datos.bloqueId },
    });

    if (!bloque) {
      throw new ErrorNegocio("El bloque de evaluación no existe", 404);
    }
  }

  if (
    datos.orden !== undefined &&
    (!Number.isInteger(datos.orden) || datos.orden < 1)
  ) {
    throw new ErrorNegocio("El orden debe ser un entero mayor a 0");
  }

  return prisma.criterioEvaluacion.update({
    where: { id },
    data: {
      ...(datos.bloqueId !== undefined ? { bloqueId: datos.bloqueId } : {}),
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.descripcion !== undefined
        ? { descripcion: datos.descripcion }
        : {}),
      ...(datos.orden !== undefined ? { orden: datos.orden } : {}),
      ...(datos.activo !== undefined ? { activo: datos.activo } : {}),
    },
  });
}
