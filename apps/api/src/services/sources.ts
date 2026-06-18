import type { Source } from "@informate/ai";

/**
 * A source the reader can actually check. We only keep references whose URL
 * resolves — the AI routinely invents plausible-looking government PDF links
 * that 404, and for a transparency outlet citing a source that doesn't exist
 * is worse than citing none. The law's own official Gazette PDF is always
 * included first, because that is the real, primary, verifiable source.
 */
async function urlResolves(url: string): Promise<boolean> {
  const tryFetch = async (method: "HEAD" | "GET") => {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
      headers: { "User-Agent": "InformateXatruch/1.0 (source verification)" },
    });
    // 405 => method not allowed (server is alive); treat <400 and 405 as reachable.
    return res.ok || res.status === 405 || res.status === 403 || res.status === 401;
  };
  try {
    return await tryFetch("HEAD");
  } catch {
    try {
      return await tryFetch("GET");
    } catch {
      return false;
    }
  }
}

/**
 * Builds the final, honest source list for a law: the official Gazette PDF
 * (always real) followed by any AI-cited references whose URLs actually
 * resolve. AI references without a URL, or whose URL is dead, are dropped —
 * they cannot be verified by a reader, so we do not claim them.
 */
export async function verifyAndEnrichSources(
  aiSources: Source[],
  gazette: { url: string; gazetteNumber: string }
): Promise<Source[]> {
  const verified: Source[] = [
    {
      title: `Diario Oficial La Gaceta, texto íntegro del decreto`,
      url: gazette.url,
      description:
        "Fuente primaria y oficial: el texto completo del decreto tal como fue publicado por el Estado de Honduras. Es la base de todo este análisis.",
    },
  ];

  const checks = await Promise.all(
    aiSources.map(async (s) => {
      if (!s.url) return null;
      if (s.url === gazette.url) return null; // avoid duplicating the gazette
      const ok = await urlResolves(s.url);
      return ok ? s : null;
    })
  );

  for (const s of checks) if (s) verified.push(s);
  return verified;
}
