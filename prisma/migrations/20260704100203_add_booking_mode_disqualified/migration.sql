-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE 'DISQUALIFIED';

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "bookingMode" TEXT NOT NULL DEFAULT 'unknown';
