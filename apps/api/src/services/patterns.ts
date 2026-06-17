import { db } from "@informate/database";
import { detectPatterns } from "@informate/ai";
import type { VotingRecord } from "@informate/ai";

export async function runPatternDetection(triggerLawId: string): Promise<void> {
  // Pull last 30 laws with their votes
  const recentVotes = await db.vote.findMany({
    where: {
      law: {
        status: "COMPLETE",
      },
    },
    include: {
      law: { select: { id: true, title: true } },
      party: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  if (recentVotes.length < 10) return;

  // Aggregate by law + party
  const aggregated = new Map<
    string,
    { lawId: string; lawTitle: string; partyName: string; for: number; against: number; abstain: number }
  >();

  for (const vote of recentVotes) {
    const key = `${vote.lawId}-${vote.party.name}`;
    const existing = aggregated.get(key) ?? {
      lawId: vote.lawId,
      lawTitle: vote.law.title,
      partyName: vote.party.name,
      for: 0,
      against: 0,
      abstain: 0,
    };

    if (vote.vote === "FOR") existing.for++;
    else if (vote.vote === "AGAINST") existing.against++;
    else if (vote.vote === "ABSTAIN") existing.abstain++;

    aggregated.set(key, existing);
  }

  const votingHistory: VotingRecord[] = Array.from(aggregated.values()).map((v) => ({
    lawId: v.lawId,
    lawTitle: v.lawTitle,
    partyName: v.partyName,
    forCount: v.for,
    againstCount: v.against,
    abstainCount: v.abstain,
  }));

  const recentLaws = await db.law.findMany({
    where: { status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { title: true },
  });

  const pattern = await detectPatterns(
    votingHistory,
    recentLaws.map((l) => l.title)
  );

  if (!pattern) return;

  await db.patternAlert.create({
    data: {
      type: pattern.type,
      severity: pattern.severity,
      description: pattern.description,
      parties: pattern.involvedParties,
      lawIds: [...pattern.relatedLawIds, triggerLawId],
    },
  });
}
