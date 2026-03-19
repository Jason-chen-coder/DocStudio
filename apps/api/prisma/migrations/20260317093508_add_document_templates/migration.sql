-- CreateEnum
CREATE TYPE "TemplateScope" AS ENUM ('SYSTEM', 'SPACE', 'USER');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('MEETING', 'TECH', 'REPORT', 'REQUIREMENT', 'GUIDE', 'OTHER');

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📄',
    "category" "TemplateCategory" NOT NULL DEFAULT 'OTHER',
    "scope" "TemplateScope" NOT NULL DEFAULT 'SYSTEM',
    "spaceId" TEXT,
    "createdBy" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_templates_scope_category_idx" ON "document_templates"("scope", "category");

-- CreateIndex
CREATE INDEX "document_templates_spaceId_idx" ON "document_templates"("spaceId");

-- CreateIndex
CREATE INDEX "document_templates_createdBy_idx" ON "document_templates"("createdBy");

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
