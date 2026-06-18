import type { MetadataRoute } from "next";
import { api } from "../lib/api";
import { SITE_URL } from "../lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/leyes`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/congresistas`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/partidos`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/alertas`, changeFrequency: "daily", priority: 0.6 },
  ];

  const lawRoutes: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    let total = Infinity;
    while (lawRoutes.length < total && page < 50) {
      const result = await api.laws.list({ page });
      total = result.total;
      if (result.laws.length === 0) break;
      lawRoutes.push(
        ...result.laws.map((law) => ({
          url: `${SITE_URL}/leyes/${law.id}`,
          lastModified: law.createdAt,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      );
      page++;
    }
  } catch {
    // API unavailable, fall back to static routes only
  }

  return [...staticRoutes, ...lawRoutes];
}
