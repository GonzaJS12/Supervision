-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "DecisionGestion" AS ENUM ('NO_REQUIERE', 'SEGUIMIENTO', 'CAPACITACION', 'SUPERVISION_INTENSIVA');

-- CreateEnum
CREATE TYPE "Clasificacion" AS ENUM ('CRITICO', 'REGULAR', 'BUENO', 'EXCELENTE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaOperativa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaOperativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" SERIAL NOT NULL,
    "areaOperativaId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgenteSanitario" (
    "id" SERIAL NOT NULL,
    "areaOperativaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "documento" TEXT,
    "legajo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgenteSanitario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueEvaluacion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloqueEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterioEvaluacion" (
    "id" SERIAL NOT NULL,
    "bloqueId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterioEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supervision" (
    "id" SERIAL NOT NULL,
    "agenteSanitarioId" INTEGER NOT NULL,
    "supervisorId" INTEGER NOT NULL,
    "areaOperativaId" INTEGER NOT NULL,
    "sectorId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "familiaNumero" INTEGER,
    "rondaNumero" INTEGER,
    "decisionGestion" "DecisionGestion" NOT NULL,
    "promedio" DECIMAL(4,2),
    "clasificacion" "Clasificacion",
    "fortalezas" TEXT,
    "oportunidadesMejora" TEXT,
    "situacionesCriticas" TEXT,
    "recomendaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supervision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionCriterio" (
    "id" SERIAL NOT NULL,
    "supervisionId" INTEGER NOT NULL,
    "criterioId" INTEGER NOT NULL,
    "criterioNombre" TEXT NOT NULL,
    "criterioDescripcion" TEXT,
    "puntuacion" INTEGER NOT NULL,

    CONSTRAINT "EvaluacionCriterio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AreaOperativa_nombre_key" ON "AreaOperativa"("nombre");

-- CreateIndex
CREATE INDEX "Sector_areaOperativaId_idx" ON "Sector"("areaOperativaId");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_areaOperativaId_numero_key" ON "Sector"("areaOperativaId", "numero");

-- CreateIndex
CREATE INDEX "AgenteSanitario_areaOperativaId_idx" ON "AgenteSanitario"("areaOperativaId");

-- CreateIndex
CREATE UNIQUE INDEX "BloqueEvaluacion_nombre_key" ON "BloqueEvaluacion"("nombre");

-- CreateIndex
CREATE INDEX "CriterioEvaluacion_bloqueId_idx" ON "CriterioEvaluacion"("bloqueId");

-- CreateIndex
CREATE INDEX "Supervision_agenteSanitarioId_idx" ON "Supervision"("agenteSanitarioId");

-- CreateIndex
CREATE INDEX "Supervision_supervisorId_idx" ON "Supervision"("supervisorId");

-- CreateIndex
CREATE INDEX "Supervision_areaOperativaId_idx" ON "Supervision"("areaOperativaId");

-- CreateIndex
CREATE INDEX "Supervision_sectorId_idx" ON "Supervision"("sectorId");

-- CreateIndex
CREATE INDEX "Supervision_fecha_idx" ON "Supervision"("fecha");

-- CreateIndex
CREATE INDEX "EvaluacionCriterio_criterioId_idx" ON "EvaluacionCriterio"("criterioId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionCriterio_supervisionId_criterioId_key" ON "EvaluacionCriterio"("supervisionId", "criterioId");

-- AddForeignKey
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_areaOperativaId_fkey" FOREIGN KEY ("areaOperativaId") REFERENCES "AreaOperativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgenteSanitario" ADD CONSTRAINT "AgenteSanitario_areaOperativaId_fkey" FOREIGN KEY ("areaOperativaId") REFERENCES "AreaOperativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioEvaluacion" ADD CONSTRAINT "CriterioEvaluacion_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "BloqueEvaluacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervision" ADD CONSTRAINT "Supervision_agenteSanitarioId_fkey" FOREIGN KEY ("agenteSanitarioId") REFERENCES "AgenteSanitario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervision" ADD CONSTRAINT "Supervision_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervision" ADD CONSTRAINT "Supervision_areaOperativaId_fkey" FOREIGN KEY ("areaOperativaId") REFERENCES "AreaOperativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervision" ADD CONSTRAINT "Supervision_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionCriterio" ADD CONSTRAINT "EvaluacionCriterio_supervisionId_fkey" FOREIGN KEY ("supervisionId") REFERENCES "Supervision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionCriterio" ADD CONSTRAINT "EvaluacionCriterio_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "CriterioEvaluacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
