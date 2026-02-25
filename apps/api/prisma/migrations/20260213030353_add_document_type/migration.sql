-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('GROUP', 'PAGE');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "type" "DocumentType" NOT NULL DEFAULT 'PAGE';
