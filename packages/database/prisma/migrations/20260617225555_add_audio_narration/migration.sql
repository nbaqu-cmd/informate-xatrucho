-- AlterEnum
ALTER TYPE "VideoType" ADD VALUE 'AUDIO_NARRATION';

-- AlterTable
ALTER TABLE "GeneratedVideo" ADD COLUMN     "script" TEXT;
