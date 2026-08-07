-- CreateTable
CREATE TABLE "checkin_challenges" (
    "id" TEXT NOT NULL,
    "checkinId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,

    CONSTRAINT "checkin_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checkin_challenges_challengeId_idx" ON "checkin_challenges"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "checkin_challenges_checkinId_challengeId_key" ON "checkin_challenges"("checkinId", "challengeId");

-- AddForeignKey
ALTER TABLE "checkin_challenges" ADD CONSTRAINT "checkin_challenges_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "checkins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_challenges" ADD CONSTRAINT "checkin_challenges_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: migrate each check-in's existing single challenge link into the
-- join table before dropping the old column, so pre-existing links survive
-- the switch to many-to-many.
INSERT INTO "checkin_challenges" ("id", "checkinId", "challengeId")
SELECT gen_random_uuid()::text, "id", "challengeId"
FROM "checkins"
WHERE "challengeId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "checkins" DROP CONSTRAINT "checkins_challengeId_fkey";

-- DropIndex
DROP INDEX "checkins_challengeId_idx";

-- AlterTable
ALTER TABLE "checkins" DROP COLUMN "challengeId";
