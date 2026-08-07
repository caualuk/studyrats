-- AlterTable
-- Backfill existing rows' updatedAt from createdAt (no prior edits to reflect).
ALTER TABLE "checkins" ADD COLUMN     "updatedAt" TIMESTAMP(3);
UPDATE "checkins" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "checkins" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "study_days" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "sourceCheckinId" TEXT,

    CONSTRAINT "study_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_days_sourceCheckinId_key" ON "study_days"("sourceCheckinId");

-- CreateIndex
CREATE UNIQUE INDEX "study_days_userId_date_key" ON "study_days"("userId", "date");

-- AddForeignKey
ALTER TABLE "study_days" ADD CONSTRAINT "study_days_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_days" ADD CONSTRAINT "study_days_sourceCheckinId_fkey" FOREIGN KEY ("sourceCheckinId") REFERENCES "checkins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
