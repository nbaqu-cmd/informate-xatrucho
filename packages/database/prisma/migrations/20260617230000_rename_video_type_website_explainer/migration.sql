-- Rename the unused AUDIO_NARRATION enum value to WEBSITE_EXPLAINER in place.
-- No rows reference it, but RENAME VALUE is data-safe regardless.
ALTER TYPE "VideoType" RENAME VALUE 'AUDIO_NARRATION' TO 'WEBSITE_EXPLAINER';
