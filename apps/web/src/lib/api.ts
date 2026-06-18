const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, path: string) {
    super(`API error ${status}: ${path}`);
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new ApiError(res.status, path);
  return res.json() as Promise<T>;
}

export interface LawListItem {
  id: string;
  lawNumber: string;
  title: string;
  gazetteDate: string;
  gazetteNumber: string;
  status: string;
  createdAt: string;
  imageUrl?: string | null;
  imageCredit?: string | null;
  summary?: { keyPoints: string[]; plainSpanish: string };
  analysis?: {
    causes: string;
    effects: string;
    benefits: string;
    drawbacks: string;
    sources: Array<{ title: string; url?: string; description: string }>;
  };
  report?: { pdfUrl: string | null };
}

export interface LawDetail {
  id: string;
  lawNumber: string;
  title: string;
  gazetteDate: string;
  gazetteNumber: string;
  status: string;
  sourceUrl: string;
  imageUrl?: string | null;
  imageCredit?: string | null;
  imageSourceUrl?: string | null;
  summary?: {
    plainSpanish: string;
    keyPoints: string[];
  };
  analysis?: {
    causes: string;
    effects: string;
    benefits: string;
    drawbacks: string;
    sources: Array<{ title: string; url?: string; description: string }>;
  };
  impactAnalysis?: {
    poorImpact: string;
    middleImpact: string;
    wealthyImpact: string;
  };
  constitutionalReview?: {
    isCompliant: boolean;
    findings: string;
    plainSummary?: string | null;
    articles: Array<{
      number: string;
      title: string;
      relevance: string;
      verdict: string;
    }>;
  };
  videos?: Array<{ type: string; url: string; duration: number; script?: string | null }>;
  transcripts?: Array<{ type: string; videoUrl: string; content: string }>;
  socialPosts?: Array<{ platform: string; url?: string; status: string }>;
  report?: { pdfUrl?: string };
  votes?: Array<{
    vote: string;
    congressman: { name: string; photoUrl?: string };
    party: { name: string; color?: string };
  }>;
}

export interface Congressman {
  id: string;
  name: string;
  photoUrl?: string;
  district?: string;
  party: { id: string; name: string; abbreviation: string; color?: string };
  _count: { votes: number; appearances: number };
}

export interface CongressmanDetail {
  id: string;
  name: string;
  photoUrl?: string;
  district?: string;
  party: { id: string; name: string; abbreviation: string; color?: string };
  votes: Array<{
    vote: string;
    createdAt: string;
    law: { id: string; title: string; gazetteDate: string };
  }>;
  appearances: Array<{ law: { id: string; title: string }; videoUrl: string; timestamp: number }>;
}

export interface Party {
  id: string;
  name: string;
  abbreviation: string;
  color?: string;
  _count: { congressmen: number; votes: number };
}

export interface PatternAlert {
  id: string;
  type: string;
  severity: string;
  description: string;
  parties: string[];
  lawIds: string[];
  resolved: boolean;
  createdAt: string;
}

export const api = {
  laws: {
    list: (params?: { page?: number; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.status) qs.set("status", params.status);
      return apiFetch<{ laws: LawListItem[]; total: number; page: number; limit: number }>(
        `/laws?${qs}`
      );
    },
    get: (id: string) => apiFetch<LawDetail>(`/laws/${id}`),
  },
  congressmen: {
    list: () => apiFetch<Congressman[]>("/congressmen"),
    get: (id: string) => apiFetch<CongressmanDetail>(`/congressmen/${id}`),
  },
  parties: {
    list: () => apiFetch<Party[]>("/parties"),
    stats: (id: string) =>
      apiFetch<{ party: Party; voteStats: Record<string, number> }>(`/parties/${id}/stats`),
  },
  alerts: {
    list: () => apiFetch<PatternAlert[]>("/alerts"),
  },
};
