import { Router } from "express";
import { db } from "@informate/database";

const router = Router();

router.get("/", async (req, res) => {
  const partyId = req.query["partyId"] as string | undefined;
  const congressmen = await db.congressman.findMany({
    where: partyId ? { partyId } : {},
    include: {
      party: true,
      _count: { select: { votes: true, appearances: true } },
    },
    orderBy: { name: "asc" },
  });
  res.json(congressmen);
});

router.get("/:id", async (req, res) => {
  const congressman = await db.congressman.findUnique({
    where: { id: req.params["id"] },
    include: {
      party: true,
      votes: {
        include: { law: { select: { id: true, title: true, gazetteDate: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      appearances: {
        include: { law: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!congressman) return res.status(404).json({ error: "Not found" });
  res.json(congressman);
});

export { router as congressmenRouter };
