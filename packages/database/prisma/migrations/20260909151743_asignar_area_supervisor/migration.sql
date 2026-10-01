-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "areaOperativaId" INTEGER;

-- CreateIndex
CREATE INDEX "Usuario_areaOperativaId_idx" ON "Usuario"("areaOperativaId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_areaOperativaId_fkey" FOREIGN KEY ("areaOperativaId") REFERENCES "AreaOperativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
