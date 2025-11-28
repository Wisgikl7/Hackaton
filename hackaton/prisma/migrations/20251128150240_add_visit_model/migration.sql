/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PRE_AUTORIZADA', 'EN_RECEPCION', 'APROBADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "role" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "nombreVisitante" TEXT NOT NULL,
    "dniVisitante" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "fechaHoraEstimada" TIMESTAMP(3) NOT NULL,
    "fechaHoraLlegada" TIMESTAMP(3),
    "autorizanteId" TEXT NOT NULL,
    "estado" "VisitStatus" NOT NULL DEFAULT 'PRE_AUTORIZADA',
    "recepcionistaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_autorizanteId_idx" ON "Visit"("autorizanteId");

-- CreateIndex
CREATE INDEX "Visit_estado_idx" ON "Visit"("estado");

-- CreateIndex
CREATE INDEX "Visit_fechaHoraEstimada_idx" ON "Visit"("fechaHoraEstimada");

-- CreateIndex
CREATE INDEX "Visit_dniVisitante_idx" ON "Visit"("dniVisitante");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_autorizanteId_fkey" FOREIGN KEY ("autorizanteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
