-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VisitStatus" ADD VALUE 'PENDIENTE_VALIDACION';
ALTER TYPE "VisitStatus" ADD VALUE 'FINALIZADA';

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_recepcionistaId_fkey" FOREIGN KEY ("recepcionistaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
