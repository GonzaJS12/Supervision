import { prisma } from "@supervision/database";
import bcrypt from "bcryptjs";
import { ErrorNegocio } from "@/lib/errores";
import { normalizarEmail } from "@/lib/email";

const selectUsuario = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  rol: true,
  activo: true,
  areaOperativaId: true,
  areaOperativa: {
    select: { id: true, externalAreaId: true, nombre: true },
  },
  createdAt: true,
  updatedAt: true,
} as const;

const selectUsuarioListado = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  rol: true,
  activo: true,
  areaOperativaId: true,
  areaOperativa: {
    select: { id: true, externalAreaId: true, nombre: true },
  },
  createdAt: true,
} as const;

export async function listarUsuarios() {
  return prisma.usuario.findMany({
    select: selectUsuarioListado,
    orderBy: { apellido: "asc" },
  });
}

export async function crearUsuario(datos: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: "ADMIN" | "SUPERVISOR";
  areaOperativaId?: number | null;
}) {
  const email = normalizarEmail(datos.email);

  const existente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existente) {
    throw new ErrorNegocio("Ya existe un usuario con ese email", 409);
  }

  if (datos.password.length < 8) {
    throw new ErrorNegocio(
      "password must be longer than or equal to 8 characters",
    );
  }

  let areaOperativaId: number | null = null;

  if (datos.rol === "SUPERVISOR") {
    if (!datos.areaOperativaId) {
      throw new ErrorNegocio(
        "Debe asignar un área operativa al supervisor",
      );
    }

    const area = await prisma.areaOperativa.findFirst({
      where: { id: datos.areaOperativaId, activo: true },
    });

    if (!area) {
      throw new ErrorNegocio(
        "El área operativa seleccionada no existe o está inactiva",
      );
    }

    areaOperativaId = datos.areaOperativaId;
  }

  const passwordHash = await bcrypt.hash(datos.password, 10);

    return prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      apellido: datos.apellido,
      email,
      passwordHash,
      rol: datos.rol,
      areaOperativaId,
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      activo: true,
      areaOperativaId: true,
      areaOperativa: {
        select: { id: true, externalAreaId: true, nombre: true },
      },
    },
  });
}

export async function cambiarEstadoUsuario(
  id: number,
  activo: boolean,
  actorId: number,
) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuario) {
    throw new ErrorNegocio("Usuario no encontrado", 404);
  }

  if (id === actorId && activo === false) {
    throw new ErrorNegocio("No puede desactivar su propia cuenta");
  }

  return prisma.usuario.update({
    where: { id },
    data: { activo },
    select: selectUsuario,
  });
}

export async function buscarUsuario(id: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: selectUsuario,
  });

  if (!usuario) {
    throw new ErrorNegocio("Usuario no encontrado", 404);
  }

  return usuario;
}

export async function modificarUsuario(
  id: number,
  datos: {
    nombre: string;
    apellido: string;
    email: string;
    areaOperativaId?: number | null;
  },
) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuario) {
    throw new ErrorNegocio("Usuario no encontrado", 404);
  }

  const email = normalizarEmail(datos.email);
  const otro = await prisma.usuario.findFirst({
    where: { email, id: { not: id } },
  });

  if (otro) {
    throw new ErrorNegocio("Ya existe un usuario con ese email", 409);
  }

  let areaOperativaId: number | null = null;

  if (usuario.rol === "SUPERVISOR") {
    if (!datos.areaOperativaId) {
      throw new ErrorNegocio(
        "Debe asignar un área operativa al supervisor",
      );
    }

    const area = await prisma.areaOperativa.findFirst({
      where: { id: datos.areaOperativaId, activo: true },
    });

    if (!area) {
      throw new ErrorNegocio(
        "El área operativa seleccionada no existe o está inactiva",
      );
    }

    areaOperativaId = datos.areaOperativaId;
  }

  return prisma.usuario.update({
    where: { id },
    data: {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email,
      areaOperativaId,
    },
    select: selectUsuario,
  });
}

export async function cambiarPasswordUsuario(
  id: number,
  password: string,
) {
  if (password.length < 8) {
    throw new ErrorNegocio(
      "password must be longer than or equal to 8 characters",
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuario) {
    throw new ErrorNegocio("El usuario no existe", 404);
  }

  return prisma.usuario.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      activo: true,
      areaOperativaId: true,
    },
  });
}

export async function cambiarAreaOperativa(
  id: number,
  areaOperativaId: number,
) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuario) {
    throw new ErrorNegocio("Usuario no encontrado", 404);
  }

  if (usuario.rol !== "SUPERVISOR") {
    throw new ErrorNegocio(
      "Solo se puede asignar un área operativa a un supervisor",
    );
  }

  const area = await prisma.areaOperativa.findFirst({
    where: { id: areaOperativaId, activo: true },
  });

  if (!area) {
    throw new ErrorNegocio(
      "El área operativa seleccionada no existe o está inactiva",
    );
  }

  return prisma.usuario.update({
    where: { id },
    data: { areaOperativaId },
    select: selectUsuario,
  });
}

export async function listarAreasActivas() {
  return prisma.areaOperativa.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
