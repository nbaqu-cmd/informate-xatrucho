import { db, LawStatus } from "@informate/database";
import {
  summarizeLaw,
  analyzeLaw,
  analyzeImpact,
  reviewConstitutionality,
} from "@informate/ai";
import { queues } from "../queues/index.js";
import { assignLawCover } from "./lawCover.js";
import { generateExplainer } from "./explainer.js";
import { verifyAndEnrichSources } from "./sources.js";

export interface PipelineJobData {
  lawId: string;
}

export async function runSummarize(lawId: string): Promise<void> {
  const law = await db.law.findUniqueOrThrow({ where: { id: lawId } });
  await db.law.update({ where: { id: lawId }, data: { status: LawStatus.SUMMARIZING } });

  const result = await summarizeLaw(law.fullText);

  await db.lawSummary.upsert({
    where: { lawId },
    create: { lawId, plainSpanish: result.plainSpanish, keyPoints: result.keyPoints },
    update: { plainSpanish: result.plainSpanish, keyPoints: result.keyPoints },
  });
}

/**
 * Generates the law's designed cover graphic (decree number, topic, category,
 * constitutional verdict). Runs after the constitutional review so the cover
 * can show the unconstitutionality alert when warranted. Never fails the law.
 */
export async function runGenerateCover(lawId: string): Promise<void> {
  try {
    await assignLawCover(lawId);
  } catch (err) {
    console.error(`[pipeline] Cover generation failed for ${lawId}:`, err instanceof Error ? err.message : err);
  }
}

export async function runDeepAnalyze(lawId: string): Promise<void> {
  const law = await db.law.findUniqueOrThrow({ where: { id: lawId } });
  await db.law.update({ where: { id: lawId }, data: { status: LawStatus.ANALYZING } });

  const result = await analyzeLaw(law.fullText, law.title);

  // Only keep sources a reader can actually verify (the official Gazette plus
  // any AI-cited URL that truly resolves); drop hallucinated/dead links.
  const sources = await verifyAndEnrichSources(result.sources, {
    url: law.sourceUrl,
    gazetteNumber: law.gazetteNumber,
  });

  await db.lawAnalysis.upsert({
    where: { lawId },
    create: {
      lawId,
      causes: result.causes,
      effects: result.effects,
      benefits: result.benefits,
      drawbacks: result.drawbacks,
      sources,
    },
    update: {
      causes: result.causes,
      effects: result.effects,
      benefits: result.benefits,
      drawbacks: result.drawbacks,
      sources,
    },
  });
}

export async function runImpactAnalyze(lawId: string): Promise<void> {
  const law = await db.law.findUniqueOrThrow({ where: { id: lawId } });
  const analysis = await db.lawAnalysis.findUnique({ where: { lawId } });

  const result = await analyzeImpact(law.fullText, law.title, {
    causes: analysis?.causes ?? "",
    effects: analysis?.effects ?? "",
  });

  await db.impactAnalysis.upsert({
    where: { lawId },
    create: {
      lawId,
      poorImpact: result.poorImpact,
      middleImpact: result.middleImpact,
      wealthyImpact: result.wealthyImpact,
    },
    update: {
      poorImpact: result.poorImpact,
      middleImpact: result.middleImpact,
      wealthyImpact: result.wealthyImpact,
    },
  });
}

export async function runConstitutionalReview(lawId: string): Promise<void> {
  const law = await db.law.findUniqueOrThrow({ where: { id: lawId } });
  const result = await reviewConstitutionality(law.fullText, law.title);

  await db.constitutionalReview.upsert({
    where: { lawId },
    create: {
      lawId,
      isCompliant: result.isCompliant,
      articles: result.articles,
      findings: result.findings,
    },
    update: {
      isCompliant: result.isCompliant,
      articles: result.articles,
      findings: result.findings,
    },
  });
}

/**
 * Generates the narrated website explainer video. Runs after all analysis
 * (summary, deep analysis, impact, constitutional review) is complete, since
 * the script and the constitutional-alert section depend on them. Failures
 * here never fail the law — the written analysis still stands on its own.
 */
export async function runGenerateExplainer(lawId: string): Promise<void> {
  try {
    await generateExplainer(lawId);
  } catch (err) {
    console.error(`[pipeline] Explainer video failed for ${lawId}:`, err instanceof Error ? err.message : err);
  }
}

export async function kickoffLawPipeline(lawId: string): Promise<void> {
  // Fan out steps 1-4 + 5a + 5b in parallel
  await Promise.all([
    queues.summarize.add("summarize", { lawId }),
    queues.deepAnalyze.add("deep-analyze", { lawId }),
    queues.impactAnalyze.add("impact-analyze", { lawId }),
    queues.constitutionalReview.add("constitutional-review", { lawId }),
    queues.transcribe.add("transcribe", { lawId }),
    queues.faceRecognize.add("face-recognize", { lawId }),
  ]);
}

export async function checkAndFinalizelaw(lawId: string): Promise<void> {
  const [summary, analysis, impact, constitutional] = await Promise.all([
    db.lawSummary.findUnique({ where: { lawId } }),
    db.lawAnalysis.findUnique({ where: { lawId } }),
    db.impactAnalysis.findUnique({ where: { lawId } }),
    db.constitutionalReview.findUnique({ where: { lawId } }),
  ]);

  if (summary && analysis && impact && constitutional) {
    await queues.generateVideo.add("generate-video", { lawId });
  }
}
