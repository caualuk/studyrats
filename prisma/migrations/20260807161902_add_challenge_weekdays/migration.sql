-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "weekdays" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[];
