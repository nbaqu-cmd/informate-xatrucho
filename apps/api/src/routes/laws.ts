import { Router } from "express";
import { db } from "@informate/database";
import { queues } from "../queues/index.js";

const router = Router();

// GET /laws — paginated list
router.get("/", async (req, res) => {
  const page = Number(req.query["page"] ?? 1);
  const limit = Number(req.query["limit"] ?? 20);
  const status = req.query["status"] as string | undefined;

  const where = status ? { status: status as never } : {};

  const [laws, total] = await Promise.all([
    db.law.findMany({
      where,
      orderBy: { gazetteDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        lawNumber: true,
        title: true,
        gazetteDate: true,
        gazetteNumber: true,
        status: true,
        createdAt: true,
        imageUrl: true,
        imageCredit: true,
        summary: { select: { keyPoints: true, plainSpanish: true } },
        analysis: { select: { causes: true, effects: true, benefits: true, drawbacks: true, sources: true } },
        report: { select: { pdfUrl: true } },
      },
    }),
    db.law.count({ where }),
  ]);

  res.json({ laws, total, page, limit });
});

// GET /laws/:id — full law detail
router.get("/:id", async (req, res) => {
  const law = await db.law.findUnique({
    where: { id: req.params["id"] },
    include: {
      summary: true,
      analysis: true,
      impactAnalysis: true,
      constitutionalReview: true,
      transcripts: true,
      appearances: {
        include: { congressman: { include: { party: true } } },
      },
      videos: true,
      socialPosts: true,
      report: true,
      votes: { include: { congressman: true, party: true } },
    },
  });

  if (!law) return res.status(404).json({ error: "Law not found" });
  res.json(law);
});

// POST /laws/trigger — manually trigger pipeline for a gazette URL
router.post("/trigger", async (req, res) => {
  const { gazetteUrl, lawNumber, lawTitle, gazetteNumber, gazetteDate } =
    req.body as {
      gazetteUrl: string;
      lawNumber: string;
      lawTitle: string;
      gazetteNumber: string;
      gazetteDate: string;
    };

  const law = await db.law.create({
    data: {
      lawNumber,
      title: lawTitle,
      gazetteNumber,
      gazetteDate: new Date(gazetteDate),
      fullText: "Pending extraction...",
      sourceUrl: gazetteUrl,
    },
  });

  await queues.lawPipeline.add("law-pipeline", { lawId: law.id });
  res.status(201).json({ lawId: law.id });
});

export { router as lawsRouter };
