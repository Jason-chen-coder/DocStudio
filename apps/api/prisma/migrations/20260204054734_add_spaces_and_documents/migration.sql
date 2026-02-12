/*
  Warnings:

  - Added the required column `content` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "documents_ydocKey_idx";

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ALTER COLUMN "ydocKey" DROP NOT NULL;

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "documents_createdBy_idx" ON "documents"("createdBy");

-- CreateIndex
CREATE INDEX "spaces_ownerId_idx" ON "spaces"("ownerId");

-- CreateIndex
CREATE INDEX "spaces_isPublic_idx" ON "spaces"("isPublic");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
