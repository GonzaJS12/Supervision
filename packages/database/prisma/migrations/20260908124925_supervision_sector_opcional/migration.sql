-- DropForeignKey
ALTER TABLE "Supervision" DROP CONSTRAINT "Supervision_sectorId_fkey";

-- AlterTable
ALTER TABLE "Supervision" ALTER COLUMN "sectorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Supervision" ADD CONSTRAINT "Supervision_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
