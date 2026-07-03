-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'READY', 'EXPORTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "offerTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "campaignId" TEXT;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_offerTemplateId_fkey" FOREIGN KEY ("offerTemplateId") REFERENCES "OfferTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: a meglévő booking_lodge leadeket egy kampányba szervezzük
INSERT INTO "Campaign" ("id", "name", "status", "offerTemplateId", "createdAt", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), 'Szauna – Booking Lodge', 'DRAFT', t."id", now(), now()
FROM "OfferTemplate" t
WHERE t."segmentKey" = 'booking_lodge'
LIMIT 1;

UPDATE "Lead" l
SET "campaignId" = c."id"
FROM "Campaign" c
WHERE c."name" = 'Szauna – Booking Lodge'
  AND l."id" IN (SELECT "leadId" FROM "Analysis" WHERE "segmentKey" = 'booking_lodge');
