import puppeteer from "puppeteer";
import { db } from "@informate/database";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const REPORTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "reports");
const HAS_AWS = Boolean(process.env["AWS_ACCESS_KEY_ID"]);

export async function compileLawReport(lawId: string): Promise<void> {
  const law = await db.law.findUniqueOrThrow({
    where: { id: lawId },
    include: {
      summary: true,
      analysis: true,
      impactAnalysis: true,
      constitutionalReview: true,
      transcripts: true,
      appearances: { include: { congressman: { include: { party: true } } } },
      videos: true,
      votes: { include: { congressman: true, party: true } },
    },
  });

  const apiUrl = process.env["API_BASE_URL"] ?? "http://localhost:4000";
  const reportUrl = `${apiUrl}/internal/report-render/${lawId}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(reportUrl, { waitUntil: "networkidle0", timeout: 60_000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
    });

    let pdfUrl: string;
    if (HAS_AWS) {
      const { uploadBuffer } = await import("@informate/media");
      pdfUrl = await uploadBuffer(Buffer.from(pdfBuffer), `reports/${lawId}/report.pdf`, "application/pdf");
    } else {
      await mkdir(REPORTS_DIR, { recursive: true });
      await writeFile(join(REPORTS_DIR, `${lawId}.pdf`), Buffer.from(pdfBuffer));
      pdfUrl = `${apiUrl}/reports/${lawId}.pdf`;
    }

    await db.report.upsert({
      where: { lawId },
      create: { lawId, pdfUrl, htmlUrl: reportUrl },
      update: { pdfUrl, htmlUrl: reportUrl },
    });
  } finally {
    await browser.close();
  }
}
