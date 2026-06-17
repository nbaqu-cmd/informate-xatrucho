-- CreateEnum
CREATE TYPE "LawStatus" AS ENUM ('PENDING', 'SUMMARIZING', 'ANALYZING', 'TRANSCRIBING', 'VIDEO_GENERATING', 'PUBLISHING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('FOR', 'AGAINST', 'ABSTAIN', 'ABSENT');

-- CreateEnum
CREATE TYPE "TranscriptType" AS ENUM ('SESSION', 'INTERVIEW');

-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('TIKTOK_REELS', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TIKTOK', 'INSTAGRAM', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('PATTERN', 'ANOMALY', 'AGENDA');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Law" (
    "id" TEXT NOT NULL,
    "gazetteNumber" TEXT NOT NULL,
    "gazetteDate" TIMESTAMP(3) NOT NULL,
    "lawNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "status" "LawStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Law_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawSummary" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "plainSpanish" TEXT NOT NULL,
    "keyPoints" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawAnalysis" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "causes" TEXT NOT NULL,
    "effects" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "drawbacks" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactAnalysis" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "poorImpact" TEXT NOT NULL,
    "middleImpact" TEXT NOT NULL,
    "wealthyImpact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstitutionalReview" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "isCompliant" BOOLEAN NOT NULL,
    "articles" JSONB NOT NULL,
    "findings" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstitutionalReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Congressman" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "faceEmbedding" JSONB,
    "district" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Congressman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "congressmanId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "vote" "VoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "type" "TranscriptType" NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CongressmanAppearance" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "congressmanId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "clipUrl" TEXT,
    "timestamp" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CongressmanAppearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedVideo" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "type" "VideoType" NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "postId" TEXT,
    "url" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "htmlUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatternAlert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "description" TEXT NOT NULL,
    "parties" JSONB NOT NULL,
    "lawIds" JSONB NOT NULL,
    "severity" "Severity" NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatternAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Law_lawNumber_key" ON "Law"("lawNumber");

-- CreateIndex
CREATE INDEX "Law_status_idx" ON "Law"("status");

-- CreateIndex
CREATE INDEX "Law_gazetteDate_idx" ON "Law"("gazetteDate");

-- CreateIndex
CREATE UNIQUE INDEX "LawSummary_lawId_key" ON "LawSummary"("lawId");

-- CreateIndex
CREATE UNIQUE INDEX "LawAnalysis_lawId_key" ON "LawAnalysis"("lawId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactAnalysis_lawId_key" ON "ImpactAnalysis"("lawId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstitutionalReview_lawId_key" ON "ConstitutionalReview"("lawId");

-- CreateIndex
CREATE UNIQUE INDEX "Party_name_key" ON "Party"("name");

-- CreateIndex
CREATE INDEX "Congressman_partyId_idx" ON "Congressman"("partyId");

-- CreateIndex
CREATE INDEX "Vote_lawId_idx" ON "Vote"("lawId");

-- CreateIndex
CREATE INDEX "Vote_partyId_idx" ON "Vote"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_lawId_congressmanId_key" ON "Vote"("lawId", "congressmanId");

-- CreateIndex
CREATE INDEX "Transcript_lawId_idx" ON "Transcript"("lawId");

-- CreateIndex
CREATE INDEX "CongressmanAppearance_lawId_idx" ON "CongressmanAppearance"("lawId");

-- CreateIndex
CREATE INDEX "CongressmanAppearance_congressmanId_idx" ON "CongressmanAppearance"("congressmanId");

-- CreateIndex
CREATE INDEX "GeneratedVideo_lawId_idx" ON "GeneratedVideo"("lawId");

-- CreateIndex
CREATE INDEX "SocialPost_lawId_idx" ON "SocialPost"("lawId");

-- CreateIndex
CREATE INDEX "SocialPost_platform_idx" ON "SocialPost"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "Report_lawId_key" ON "Report"("lawId");

-- CreateIndex
CREATE INDEX "PatternAlert_severity_idx" ON "PatternAlert"("severity");

-- CreateIndex
CREATE INDEX "PatternAlert_resolved_idx" ON "PatternAlert"("resolved");

-- AddForeignKey
ALTER TABLE "LawSummary" ADD CONSTRAINT "LawSummary_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawAnalysis" ADD CONSTRAINT "LawAnalysis_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAnalysis" ADD CONSTRAINT "ImpactAnalysis_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstitutionalReview" ADD CONSTRAINT "ConstitutionalReview_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Congressman" ADD CONSTRAINT "Congressman_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_congressmanId_fkey" FOREIGN KEY ("congressmanId") REFERENCES "Congressman"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CongressmanAppearance" ADD CONSTRAINT "CongressmanAppearance_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CongressmanAppearance" ADD CONSTRAINT "CongressmanAppearance_congressmanId_fkey" FOREIGN KEY ("congressmanId") REFERENCES "Congressman"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedVideo" ADD CONSTRAINT "GeneratedVideo_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE CASCADE ON UPDATE CASCADE;
