/*
  Warnings:

  - A unique constraint covering the columns `[externalUserId]` on the table `AgenteSanitario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalUuid]` on the table `AgenteSanitario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalAreaId]` on the table `AreaOperativa` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalUuid]` on the table `Sector` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AreaOperativa_nombre_key";

-- AlterTable
ALTER TABLE "AgenteSanitario" ADD COLUMN     "cobertura" TEXT,
ADD COLUMN     "externalUserId" INTEGER,
ADD COLUMN     "externalUuid" TEXT,
ADD COLUMN     "sectorId" INTEGER;

-- AlterTable
ALTER TABLE "AreaOperativa" ADD COLUMN     "estabBase" TEXT,
ADD COLUMN     "externalAreaId" INTEGER,
ADD COLUMN     "zonaId" INTEGER;

-- AlterTable
ALTER TABLE "Sector" ADD COLUMN     "centroSaludId" INTEGER,
ADD COLUMN     "centroSaludUuid" TEXT,
ADD COLUMN     "cobertura" TEXT,
ADD COLUMN     "externalSectorId" INTEGER,
ADD COLUMN     "externalUuid" TEXT;

-- AlterTable
ALTER TABLE "Supervision" ADD COLUMN     "rondaId" INTEGER;

-- CreateTable
CREATE TABLE "Zona" (
    "id" SERIAL NOT NULL,
    "externalZonaId" INTEGER,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ronda" (
    "id" SERIAL NOT NULL,
    "externalRondaId" INTEGER,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ronda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zona_externalZonaId_key" ON "Zona"("externalZonaId");

-- CreateIndex
CREATE UNIQUE INDEX "Ronda_externalRondaId_key" ON "Ronda"("externalRondaId");

-- CreateIndex
CREATE UNIQUE INDEX "AgenteSanitario_externalUserId_key" ON "AgenteSanitario"("externalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AgenteSanitario_externalUuid_key" ON "AgenteSanitario"("externalUuid");

-- CreateIndex
CREATE INDEX "AgenteSanitario_sectorId_idx" ON "AgenteSanitario"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "AreaOperativa_externalAreaId_key" ON "AreaOperativa"("externalAreaId");

-- CreateIndex
CREATE INDEX "AreaOperativa_zonaId_idx" ON "AreaOperativa"("zonaId");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_externalUuid_key" ON "Sector"("externalUuid");

-- CreateIndex
CREATE INDEX "Sector_externalSectorId_idx" ON "Sector"("externalSectorId");

-- CreateIndex
CREATE INDEX "Supervision_rondaId_idx" ON "Supervision"("rondaId");

-- AddForeignKey
ALTER TABLE "AreaOperativa" ADD CONSTRAINT "AreaOperativa_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "Zona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgenteSanitario" ADD CONSTRAINT "AgenteSanitario_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervision" ADD CONSTRAINT "Supervision_rondaId_fkey" FOREIGN KEY ("rondaId") REFERENCES "Ronda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
