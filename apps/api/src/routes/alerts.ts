import { Router } from "express";
import { db } from "@informate/database";

const router = Router();

router.get("/", async (req, res) => {
  const resolved = req.query["resolved"] === "true";
  const alerts = await db.patternAlert.findMany({
    where: { resolved },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
  res.json(alerts);
});

router.patch("/:id/resolve", async (req, res) => {
  const alert = await db.patternAlert.update({
    where: { id: req.params["id"] },
    data: { resolved: true },
  });
  res.json(alert);
});

export { router as alertsRouter };
