-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'MOVE', 'RESTORE', 'SHARE', 'JOIN', 'LEAVE', 'INVITE', 'ROLE_CHANGE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('DOCUMENT', 'SPACE', 'SNAPSHOT', 'SHARE_LINK', 'MEMBER');

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "spaceId" TEXT,
    "spaceName" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_visits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "lastVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_logs_userId_createdAt_idx" ON "activity_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_spaceId_createdAt_idx" ON "activity_logs"("spaceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "document_visits_userId_lastVisitAt_idx" ON "document_visits"("userId", "lastVisitAt" DESC);

-- CreateIndex
CREATE INDEX "document_visits_spaceId_idx" ON "document_visits"("spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "document_visits_userId_documentId_key" ON "document_visits"("userId", "documentId");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_visits" ADD CONSTRAINT "document_visits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_visits" ADD CONSTRAINT "document_visits_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
