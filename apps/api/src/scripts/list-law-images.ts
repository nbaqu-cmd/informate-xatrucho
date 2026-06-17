import "../env.js";
import { db } from "@informate/database";

async function main() {
  const laws = await db.law.findMany({
    select: { lawNumber: true, title: true, imageUrl: true, imageCredit: true },
    orderBy: { lawNumber: "asc" },
  });
  for (const l of laws) {
    console.log((l.imageUrl ? "[OK]" : "[--]"), l.lawNumber, "-", l.title.slice(0, 70));
    if (l.imageUrl) console.log("      credit:", l.imageCredit);
  }
  process.exit(0);
}

main();
