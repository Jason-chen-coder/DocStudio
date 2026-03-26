-- CreateEnum
CREATE TYPE "AiPlan" AS ENUM ('BASIC', 'VIP', 'MAX');

-- CreateEnum
CREATE TYPE "AiBillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "AiSubStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_EXPIRED';

-- CreateTable
CREATE TABLE "ai_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "AiPlan" NOT NULL,
    "billingPeriod" "AiBillingPeriod" NOT NULL,
    "status" "AiSubStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_subscription_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "AiPlan" NOT NULL,
    "billingPeriod" "AiBillingPeriod" NOT NULL,
    "status" "AiRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "rejectReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_subscription_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_subscriptions_userId_key" ON "ai_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "ai_subscriptions_userId_status_idx" ON "ai_subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "ai_subscriptions_endDate_idx" ON "ai_subscriptions"("endDate");

-- CreateIndex
CREATE INDEX "ai_subscription_requests_status_createdAt_idx" ON "ai_subscription_requests"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ai_subscription_requests_userId_createdAt_idx" ON "ai_subscription_requests"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ai_subscriptions" ADD CONSTRAINT "ai_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_subscription_requests" ADD CONSTRAINT "ai_subscription_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
