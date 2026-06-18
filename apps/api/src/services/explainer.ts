import { db } from "@informate/database";
import { generateNarrationScript } from "@informate/ai";
import { renderExplainerVideo, type ExplainerScriptInput } from "@informate/media";
import { writeFile, mkdir, rm } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const VIDEOS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "law-videos");
const HAS_AWS = Boolean(process.env["AWS_ACCESS_KEY_ID"]);

/**
 * Generates the narrated website explainer video for a law: writes a
 * professional Spanish script from the law's own analysis (with the
 * constitutional verdict emphasized when the law may be unconstitutional),
 * narrates it with a free Honduran neural voice, renders the video, stores it,
 * and records it as the law's WEBSITE_EXPLAINER video. Requires the full
 * analysis to exist; callers run this only after the pipeline's analysis steps.
 */
export async function generateExplainer(lawId: string): Promise<void> {
  const law = await db.law.findUniqueOrThrow({
    where: { id: lawId },
    include: { summary: true, analysis: true, impactAnalysis: true, constitutionalReview: true },
  });

  if (!law.summary || !law.analysis || !law.impactAnalysis || !law.constitutionalReview) {
    console.log(`[explainer] Skipping Decreto ${law.lawNumber}: analysis incomplete`);
    return;
  }

  const gazetteDate = new Date(law.gazetteDate).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const script = await generateNarrationScript({
    title: law.title,
    lawNumber: law.lawNumber,
    summary: law.summary.plainSpanish,
    causes: law.analysis.causes,
    effects: law.analysis.effects,
    benefits: law.analysis.benefits,
    drawbacks: law.analysis.drawbacks,
    poorImpact: law.impactAnalysis.poorImpact,
    middleImpact: law.impactAnalysis.middleImpact,
    wealthyImpact: law.impactAnalysis.wealthyImpact,
    isConstitutional: law.constitutionalReview.isCompliant,
    constitutionalFindings: law.constitutionalReview.findings,
  });

  const renderInput: ExplainerScriptInput = {
    lawTitle: law.title,
    lawNumber: law.lawNumber,
    gazetteDate,
    isConstitutional: law.constitutionalReview.isCompliant,
    intro: script.intro,
    sections: script.sections,
    outro: script.outro,
  };

  // The explainer uses clean, generated typographic cards — consistent with
  // the law's designed cover, and never a looked-up photo that could mislead.
  console.log(`[explainer] Rendering video for Decreto ${law.lawNumber}...`);
  const rendered = await renderExplainerVideo(renderInput, [], lawId);

  const { readFile } = await import("fs/promises");
  const videoBuffer = await readFile(rendered.path);

  let videoUrl: string;
  if (HAS_AWS) {
    const { uploadFile } = await import("@informate/media");
    videoUrl = await uploadFile(rendered.path, `law-videos/${lawId}.mp4`);
  } else {
    await mkdir(VIDEOS_DIR, { recursive: true });
    await writeFile(join(VIDEOS_DIR, `${lawId}.mp4`), videoBuffer);
    const apiUrl = process.env["API_BASE_URL"] ?? "http://localhost:4000";
    videoUrl = `${apiUrl}/law-videos/${lawId}.mp4`;
  }

  // One explainer per law: replace any prior render rather than accumulating.
  await db.generatedVideo.deleteMany({ where: { lawId, type: "WEBSITE_EXPLAINER" } });
  await db.generatedVideo.create({
    data: {
      lawId,
      type: "WEBSITE_EXPLAINER",
      url: videoUrl,
      duration: Math.round(rendered.durationSeconds),
      script: JSON.stringify(script),
    },
  });

  await rm(rendered.path, { force: true }).catch(() => {});
  console.log(
    `[explainer] Done Decreto ${law.lawNumber} (${Math.round(rendered.durationSeconds)}s, voz: ${rendered.provider})`
  );
}
