import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { PrismaClient, RolUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";

const raiz = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

config({ path: path.join(raiz, ".env") });

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("Falta DATABASE_URL en el .env de la raíz");
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

const bloques = [
  {
    nombre: "ROL SANITARIO BASICO",
    descripcion:
      "Evaluación de las funciones sanitarias básicas del agente en terreno.",
    orden: 1,
    criterios: [
      "Fortalece el nivel de alarma en la familia (embarazada, RN, puérpera)",
      "Realiza visita domiciliaria efectiva (evaluación + intervención)",
      "Imparte educación para la salud según problemática detectada",
    ],
  },
  {
    nombre: "PROGRAMAS PRIORITARIOS",
    descripcion:
      "Evaluación de actividades relacionadas con programas sanitarios prioritarios.",
    orden: 2,
    criterios: [
      "Controla y comopleta vacunación según normas vigentes",
      "Aplica estrategia AIEPI en población materno-infantil",
      "Realiza, analiza y comunica estado nutricional en menores de 6 años",
    ],
  },
  {
    nombre: "VIGILANCIA Y RIESGO",
    descripcion:
      "Evaluación de vigilancia epidemiológica, detección de riesgos y registro sanitario.",
    orden: 3,
    criterios: [
      "Realiza vigilancia epidemiológica activa",
      "Realiza busqueda, aactua y avisa ante sintomáticos respiratorios (TBC)",
      "Registra información sanitaria de manera digital",
    ],
  },
  {
    nombre: "ABORDAJE FAMILIA Y COMUNITARIO",
    descripcion:
      "Evaluación del abordaje de las familias y de las problemáticas comunitarias.",
    orden: 4,
    criterios: [
      "Caracteriza a la familia según riesgo/prioridad",
      "Promueve saneamiento ambiental (agua, residuos, higiene)",
      "Desarrolla acciones en población vulnerable del sector",
    ],
  },
  {
    nombre: "PROBLEMATICA COMPLEJAS",
    descripcion:
      "Evaluación de la detección y abordaje de problemáticas sanitarias complejas.",
    orden: 5,
    criterios: [
      "Detecta enfermedades crónicas no transmisibles",
      "Identifica problemas psicosociales (consumo, violencia, salud mental)",
      "Articula con redes de salud y sociales",
    ],
  },
  {
    nombre: "ASPECTO INSTITUCIONAL",
    descripcion:
      "Evaluación de las actitudes y capacidades del agente sanitario.",
    orden: 6,
    criterios: [
      "Respeto hacia la familia",
      "Respeto hacia el equipo y superiores",
      "Comunicación efectiva con el equipo de salud",
      "Participación y compromiso en actividades",
      "Proactividad en terreno",
      "Capacidad de autocrítica",
      "Adaptabilidad a situaciones del territorio",
      "Capacidad de gestión y resolución de problemas",
    ],
  },
];

async function main() {
  console.log("Iniciando seed...");

  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ?? "admin@supervision.local";
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "admin12@";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      nombre: "Administrador",
      apellido: "Sistema",
      rol: RolUsuario.ADMIN,
      activo: true,
    },
    create: {
      nombre: "Administrador",
      apellido: "Sistema",
      email: adminEmail,
      passwordHash,
      rol: RolUsuario.ADMIN,
      activo: true,
    },
  });

  console.log(`Administrador: ${admin.email}`);

  for (const bloqueData of bloques) {
    const bloque = await prisma.bloqueEvaluacion.upsert({
      where: { nombre: bloqueData.nombre },
      update: {
        descripcion: bloqueData.descripcion,
        orden: bloqueData.orden,
        activo: true,
      },
      create: {
        nombre: bloqueData.nombre,
        descripcion: bloqueData.descripcion,
        orden: bloqueData.orden,
        activo: true,
      },
    });

    console.log(`Bloque: ${bloque.nombre}`);

    for (let index = 0; index < bloqueData.criterios.length; index++) {
      const nombre = bloqueData.criterios[index];
      const existente = await prisma.criterioEvaluacion.findFirst({
        where: { bloqueId: bloque.id, nombre },
      });

      if (existente) {
        await prisma.criterioEvaluacion.update({
          where: { id: existente.id },
          data: { orden: index + 1, activo: true },
        });
      } else {
        await prisma.criterioEvaluacion.create({
          data: {
            bloqueId: bloque.id,
            nombre,
            orden: index + 1,
            activo: true,
          },
        });
      }
    }
  }

  const cuantasRondas = await prisma.ronda.count();

  if (cuantasRondas === 0) {
    await prisma.ronda.create({
      data: { nombre: "Ronda 1", activo: true },
    });
    console.log("Ronda inicial: Ronda 1");
  }

  console.log("Seed finalizado correctamente.");
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
