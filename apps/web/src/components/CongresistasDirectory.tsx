"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Congressman } from "../lib/api";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Lowercase + strip accents so "José" matches "jose". */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function CongresistasDirectory({ congressmen }: { congressmen: Congressman[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return congressmen;
    const terms = q.split(/\s+/).filter(Boolean);
    return congressmen.filter((c) => {
      const haystack = normalize(
        `${c.name} ${c.party.name} ${c.party.abbreviation} ${c.district ?? ""}`
      );
      // Every typed word must appear somewhere — lets you combine name + party.
      return terms.every((t) => haystack.includes(t));
    });
  }, [query, congressmen]);

  return (
    <>
      <div className="mb-8 max-w-xl">
        <label htmlFor="diputado-search" className="sr-only">
          Buscar diputado
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" aria-hidden="true">
            {/* search icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </span>
          <input
            id="diputado-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, partido o departamento…"
            autoComplete="off"
            className="w-full border border-border bg-white pl-11 pr-10 py-3 text-[15px] text-ink placeholder:text-ink-300 focus:outline-none focus:border-honduras-blue focus:ring-1 focus:ring-honduras-blue transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        <div className="text-xs text-ink-500 mt-2" aria-live="polite">
          {query
            ? `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""} para “${query}”`
            : `${congressmen.length} diputados`}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-ink-500 border border-border">
          No se encontró ningún diputado para “{query}”.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filtered.map((c) => {
            const color = c.party.color ?? "#6E6A5E";
            return (
              <a key={c.id} href={`/congresistas/${c.id}`} className="group block">
                <div
                  className="aspect-square border border-border relative overflow-hidden flex items-center justify-center"
                  style={{
                    background: c.photoUrl
                      ? undefined
                      : `linear-gradient(150deg, ${color} 0%, #15171C 130%)`,
                  }}
                >
                  {c.photoUrl ? (
                    <Image
                      src={c.photoUrl}
                      alt={c.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  ) : (
                    <span className="font-serif font-black text-4xl text-white/90">{initials(c.name)}</span>
                  )}
                  <span className="absolute left-0 right-0 bottom-0 h-1" style={{ background: color }} />
                </div>
                <div className="mt-3">
                  <div className="font-bold text-ink leading-tight group-hover:text-honduras-red transition-colors">
                    {c.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-500">
                    <span className="w-2 h-2" style={{ background: color }} />
                    {c.party.name}
                  </div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{c.district}</div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}
