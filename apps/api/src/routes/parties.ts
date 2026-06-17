import { Router } from "express";
import { db } from "@informate/database";

const router = Router();

router.get("/", async (_req, res) => {
  const parties = await db.party.findMany({
    include: {
      _count: { select: { congressmen: true, votes: true } },
    },
    orderBy: { name: "asc" },
  });
  res.json(parties);
});

router.get("/:id/stats", async (req, res) => {
  const partyId = req.params["id"]!;

  const [party, voteStats] = await Promise.all([
    db.party.findUnique({
      where: { id: partyId },
      include: { congressmen: true },
    }),
    db.$queryRaw<Array<{ vote: string; count: bigint }>>`
      SELECT vote, COUNT(*) as count
      FROM "Vote"
      WHERE "partyId" = ${partyId}
      GROUP BY vote
    `,
  ]);

  if (!party) return res.status(404).json({ error: "Not found" });

  const stats = {
    for: 0,
    against: 0,
    abstain: 0,
    absent: 0,
  };
  for (const row of voteStats) {
    const key = row.vote.toLowerCase() as keyof typeof stats;
    if (key in stats) stats[key] = Number(row.count);
  }

  res.json({ party, voteStats: stats });
});

export { router as partiesRouter };
