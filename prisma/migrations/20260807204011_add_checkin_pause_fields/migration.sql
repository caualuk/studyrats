-- AlterTable
ALTER TABLE "checkins" ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "pausedMs" INTEGER NOT NULL DEFAULT 0;
