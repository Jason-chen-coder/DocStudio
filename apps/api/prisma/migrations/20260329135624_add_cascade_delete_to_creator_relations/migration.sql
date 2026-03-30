-- DropForeignKey
ALTER TABLE "document_snapshots" DROP CONSTRAINT "document_snapshots_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "document_templates" DROP CONSTRAINT "document_templates_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_createdBy_fkey";

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_snapshots" ADD CONSTRAINT "document_snapshots_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
