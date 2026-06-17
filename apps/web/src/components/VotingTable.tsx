"use client";

import { useMemo, useState } from "react";

export interface VoteRow {
  name: string;
  party: string;
  partyColor?: string;
  vote: string;
}

const VOTE_COLORS: Record<string, string> = {
  FOR: "#1F7A4D",
  AGAINST: "#CE1126",
  ABSTAIN: "#A66A00",
  ABSENT: "#9A9384",
};

const VOTE_LABELS: Record<string, string> = {
  FOR: "A favor",
  AGAINST: "En contra",
  ABSTAIN: "Abstención",
  ABSENT: "Ausente",
};

type SortKey = "name" | "party" | "vote";

export function VotingTable({ rows }: { rows: VoteRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("party");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return av.localeCompare(bv) * sortDir;
    });
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 1 ? -1 : 1) as 1 | -1);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse">
        <caption className="sr-only">Registro de votación por congresista</caption>
        <colgroup>
          <col style={{ width: "44%" }} />
          <col style={{ width: "33%" }} />
          <col style={{ width: "23%" }} />
        </colgroup>
        <thead>
          <tr className="bg-paper-200 border-b-2 border-ink">
            <SortHeader label="Congresista" sortKey="name" sortKeyActive={sortKey} sortDir={sortDir} onClick={() => toggleSort("name")} />
            <SortHeader label="Partido" sortKey="party" sortKeyActive={sortKey} sortDir={sortDir} onClick={() => toggleSort("party")} />
            <SortHeader label="Voto" sortKey="vote" sortKeyActive={sortKey} sortDir={sortDir} align="right" onClick={() => toggleSort("vote")} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-paper-200/60 transition-colors">
              <td className="px-4 py-3 text-sm font-semibold text-ink">{row.name}</td>
              <td className="px-4 py-3 text-sm text-ink-500">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 flex-shrink-0"
                    aria-hidden="true"
                    style={{ background: row.partyColor ?? "#9A9384" }}
                  />
                  {row.party}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-xs font-bold" style={{ color: VOTE_COLORS[row.vote] ?? "#9A9384" }}>
                {VOTE_LABELS[row.vote] ?? row.vote}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortHeader({
  label,
  align = "left",
  sortKey,
  sortKeyActive,
  sortDir,
  onClick,
}: {
  label: string;
  align?: "left" | "right";
  sortKey: SortKey;
  sortKeyActive: SortKey;
  sortDir: 1 | -1;
  onClick: () => void;
}) {
  const active = sortKey === sortKeyActive;
  const ariaSort = active ? (sortDir === 1 ? "ascending" : "descending") : "none";

  return (
    <th scope="col" aria-sort={ariaSort} className="p-0">
      <button
        onClick={onClick}
        className={`w-full text-${align} text-[11px] font-bold uppercase tracking-wide px-4 py-3 hover:text-honduras-red focus-visible:ring-2 focus-visible:ring-honduras-blue focus-visible:ring-inset transition-colors ${
          active ? "text-honduras-red" : "text-ink-500"
        }`}
      >
        {label} ⇕
      </button>
    </th>
  );
}
