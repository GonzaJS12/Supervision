-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Supervision" ADD COLUMN "claveIdempotencia" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Supervision_claveIdempotencia_key" ON "Supervision"("claveIdempotencia");

-- CreateTable
CREATE TABLE "IntentoLogin" (
    "clave" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "reset" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntentoLogin_pkey" PRIMARY KEY ("clave")
);
