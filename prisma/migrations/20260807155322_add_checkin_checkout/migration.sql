-- AlterTable
ALTER TABLE "checkins" ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "photoUrl" DROP NOT NULL;

-- Backfill: pre-existing check-ins were always created "already complete"
-- in one step (before the check-in/check-out split), so they count as
-- checked out immediately at their original createdAt -- otherwise they'd
-- all silently disappear from feeds/streaks/ranking as "in progress".
UPDATE "checkins" SET "checkedOutAt" = "createdAt" WHERE "checkedOutAt" IS NULL;
