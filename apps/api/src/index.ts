import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import { Worker } from "bullmq";
import { allQueues, queues, connection } from "./queues/index.js";
import { lawsRouter } from "./routes/laws.js";
import { congressmenRouter } from "./routes/congressmen.js";
import { partiesRouter } from "./routes/parties.js";
import { alertsRouter } from "./routes/alerts.js";
import {
  runSummarize,
  runDeepAnalyze,
  runImpactAnalyze,
  runConstitutionalReview,
  kickoffLawPipeline,
  checkAndFinalizelaw,
} from "./services/pipeline.js";
import { compileLawReport } from "./services/report.js";
import { runPatternDetection } from "./services/patterns.js";
import { db, LawStatus } from "@informate/database";

const app = express();
const PORT = process.env["PORT"] ?? 4000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const REPORTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "reports");
app.use("/reports", express.static(REPORTS_DIR));

const LAW_IMAGES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "law-images");
app.use("/law-images", express.static(LAW_IMAGES_DIR));

const LAW_VIDEOS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "law-videos");
app.use("/law-videos", express.static(LAW_VIDEOS_DIR));

// Bull Board UI at /admin/queues
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: allQueues().map((q) => new BullMQAdapter(q)),
  serverAdapter,
});
app.use("/admin/queues", serverAdapter.getRouter());

// REST API routes
app.use("/laws", lawsRouter);
app.use("/congressmen", congressmenRouter);
app.use("/parties", partiesRouter);
app.use("/alerts", alertsRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Internal route for Puppeteer PDF rendering
app.get("/internal/report-render/:lawId", async (req, res) => {
  const law = await db.law.findUnique({
    where: { id: req.params["lawId"] },
    include: {
      summary: true,
      analysis: true,
      impactAnalysis: true,
      constitutionalReview: true,
      transcripts: true,
      votes: { include: { congressman: true, party: true } },
      videos: true,
    },
  });
  if (!law) return res.status(404).send("Not found");

  // Simple HTML report — in production, use a proper template engine
  const html = generateReportHtml(law);
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// ─── BullMQ inline workers (steps 1-4, compile-report, pattern-detect) ───────

new Worker(
  "law-pipeline",
  async (job) => {
    const { lawId } = job.data as { lawId: string };
    await kickoffLawPipeline(lawId);
  },
  { connection }
);

new Worker(
  "summarize",
  async (job) => {
    const { lawId } = job.data as { lawId: string };
    await runSummarize(lawId);
    await checkAndFinalizelaw(lawId);
  },
  { connection }
);

new Worker(
  "deep-analyze",
  async (job) => {
    const { lawId } = job.data as { lawId: string };
    await runDeepAnalyze(lawId);
    await checkAndFinalizelaw(lawId);
  },
  { connection }
);

new Worker(
  "impact-analyze",
  async (job) => {
    const { lawId } = job.data as { lawId: string };
    await runImpactAnalyze(lawId);
    await checkAndFinalizelaw(lawId);
  },
  { connection }
);

new Worker(
  "constitutional-review",
  async (job) => {
    const { lawId } = job.data as { lawId: string };
    await runConstitutionalReview(lawId);
    await checkAndFinalizelaw(lawId);
  },
  { connection }
);

new Worker(
  "compile-report",
  async (job) => {
    const { lawId } = job.data as { lawId: string };
    await compileLawReport(lawId);
    await db.law.update({ where: { id: lawId }, data: { status: LawStatus.COMPLETE } });
    await queues.patternDetect.add("pattern-detect", { lawId });
  },
  { connection }
);

new Worker(
  "pattern-detect",
  async (job) => {
    const { lawId } = job.data as { lawId: string };
    await runPatternDetection(lawId);
  },
  { connection }
);

// ─── Scheduled cron jobs ──────────────────────────────────────────────────────

// Gazette monitor: every hour
await queues.gazetteMonitor.add(
  "monitor",
  {},
  { repeat: { pattern: "0 * * * *" } }
);

// Congress monitor: every hour (offset by 30 min)
await queues.congressMonitor.add(
  "monitor",
  {},
  { repeat: { pattern: "30 * * * *" } }
);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Bull Board: http://localhost:${PORT}/admin/queues`);
});

function generateReportHtml(law: Record<string, unknown>): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte — ${(law as { title?: string }).title ?? "Ley"}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
    h1 { font-size: 2rem; border-bottom: 3px solid #3B82F6; padding-bottom: 12px; }
    h2 { color: #3B82F6; margin-top: 40px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 700; }
    .badge-blue { background: #DBEAFE; color: #1D4ED8; }
    .badge-green { background: #D1FAE5; color: #065F46; }
    .badge-red { background: #FEE2E2; color: #991B1B; }
    .section { background: #F9FAFB; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
    th { background: #F3F4F6; font-weight: 600; }
    .vote-for { color: #065F46; }
    .vote-against { color: #991B1B; }
    .vote-abstain { color: #92400E; }
  </style>
</head>
<body>
  <h1>${(law as { title?: string }).title ?? ""}</h1>
  <p>
    <span class="badge badge-blue">Decreto ${(law as { lawNumber?: string }).lawNumber ?? ""}</span>
    &nbsp;
    <span class="badge badge-blue">Gaceta No. ${(law as { gazetteNumber?: string }).gazetteNumber ?? ""}</span>
  </p>
  <p><strong>Fecha:</strong> ${new Date((law as { gazetteDate?: string }).gazetteDate ?? "").toLocaleDateString("es-HN")}</p>

  <h2>Resumen</h2>
  <div class="section">${(law as { summary?: { plainSpanish?: string } }).summary?.plainSpanish ?? "Pendiente"}</div>

  <h2>Análisis Profundo</h2>
  <p><strong>Causas:</strong> ${(law as { analysis?: { causes?: string } }).analysis?.causes ?? ""}</p>
  <p><strong>Efectos:</strong> ${(law as { analysis?: { effects?: string } }).analysis?.effects ?? ""}</p>
  <p><strong>Beneficios:</strong> ${(law as { analysis?: { benefits?: string } }).analysis?.benefits ?? ""}</p>
  <p><strong>Desventajas:</strong> ${(law as { analysis?: { drawbacks?: string } }).analysis?.drawbacks ?? ""}</p>

  <h2>Impacto por Clase Social</h2>
  <p><strong>Clase Baja:</strong> ${(law as { impactAnalysis?: { poorImpact?: string } }).impactAnalysis?.poorImpact ?? ""}</p>
  <p><strong>Clase Media:</strong> ${(law as { impactAnalysis?: { middleImpact?: string } }).impactAnalysis?.middleImpact ?? ""}</p>
  <p><strong>Clase Alta:</strong> ${(law as { impactAnalysis?: { wealthyImpact?: string } }).impactAnalysis?.wealthyImpact ?? ""}</p>

  <h2>Revisión Constitucional</h2>
  <span class="badge ${(law as { constitutionalReview?: { isCompliant?: boolean } }).constitutionalReview?.isCompliant ? "badge-green" : "badge-red"}">
    ${(law as { constitutionalReview?: { isCompliant?: boolean } }).constitutionalReview?.isCompliant ? "CONSTITUCIONAL" : "POSIBLE INCONSTITUCIONALIDAD"}
  </span>
  <div class="section">${(law as { constitutionalReview?: { findings?: string } }).constitutionalReview?.findings ?? ""}</div>

  <p style="margin-top: 60px; color: #6B7280; font-size: 0.85rem; text-align: center;">
    Generado por Infórmate Xatrucho — transparencia legislativa para Honduras
  </p>
</body>
</html>`;
}
