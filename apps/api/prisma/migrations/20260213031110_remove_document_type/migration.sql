/*
  Warnings:

  - You are about to drop the column `type` on the `documents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "type";

-- DropEnum
DROP TYPE "DocumentType";
