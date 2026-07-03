-- CreateEnum
CREATE TYPE "KeywordStatus" AS ENUM ('PLANNED', 'IMPORTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "notes" TEXT,
    "status" "KeywordStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_term_key" ON "Keyword"("term");

-- AlterTable: add nullable FK first (before dropping old column)
ALTER TABLE "ImportBatch" ADD COLUMN "keywordId" TEXT;

-- Backfill 1: create Keyword rows from existing Lead.sourceKeyword (megőrzött adat)
INSERT INTO "Keyword" ("id", "term", "status", "createdAt", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text || sk), sk, 'IMPORTED', now(), now()
FROM (
  SELECT DISTINCT "sourceKeyword" AS sk FROM "Lead"
  WHERE "sourceKeyword" IS NOT NULL AND "sourceKeyword" <> ''
) d
ON CONFLICT ("term") DO NOTHING;

-- Link batches via their leads' sourceKeyword
UPDATE "ImportBatch" b
SET "keywordId" = k."id"
FROM (
  SELECT DISTINCT "importBatchId" AS bid, "sourceKeyword" AS sk FROM "Lead"
  WHERE "importBatchId" IS NOT NULL AND "sourceKeyword" IS NOT NULL
) m
JOIN "Keyword" k ON k."term" = m.sk
WHERE b."id" = m.bid;

-- Backfill 2: batches without leads but with an old keyword value
INSERT INTO "Keyword" ("id", "term", "status", "createdAt", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text || "keyword"), "keyword", 'IMPORTED', now(), now()
FROM "ImportBatch"
WHERE "keyword" IS NOT NULL AND "keyword" <> ''
ON CONFLICT ("term") DO NOTHING;

UPDATE "ImportBatch" b
SET "keywordId" = k."id"
FROM "Keyword" k
WHERE b."keyword" = k."term" AND b."keywordId" IS NULL;

-- DropColumn (adat már átmentve)
ALTER TABLE "ImportBatch" DROP COLUMN "keyword";

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;
