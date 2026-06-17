import { chromium } from "playwright";
import * as cheerio from "cheerio";

export interface CongressLaw {
  lawNumber: string;
  title: string;
  approvalDate: Date;
  sourceUrl: string;
}

export interface CongressmanRecord {
  name: string;
  party: string;
  district: string;
  photoUrl?: string;
}

export interface VotingRecord {
  lawNumber: string;
  congressmanName: string;
  party: string;
  vote: "FOR" | "AGAINST" | "ABSTAIN" | "ABSENT";
}

const CONGRESS_BASE_URL = "https://www.congresonacional.hn";

export async function fetchRecentlyApprovedLaws(
  sinceDate?: Date
): Promise<CongressLaw[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${CONGRESS_BASE_URL}/decretos`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });

    const html = await page.content();
    const $ = cheerio.load(html);
    const laws: CongressLaw[] = [];

    // Congress site lists approved decrees in a table or list
    $("table tr, .decreto-item, .law-entry").each((_, el) => {
      const $el = $(el);
      const cells = $el.find("td");

      const dateText = cells.eq(0).text().trim() || $el.find(".date").text().trim();
      const lawNumText = cells.eq(1).text().trim() || $el.find(".numero").text().trim();
      const titleText = cells.eq(2).text().trim() || $el.find(".titulo").text().trim();
      const link = $el.find("a").attr("href");

      if (!dateText || !lawNumText) return;

      const dateMatch = dateText.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
      if (!dateMatch) return;

      const approvalDate = new Date(
        `${dateMatch[3]}-${dateMatch[2]?.padStart(2, "0")}-${dateMatch[1]?.padStart(2, "0")}`
      );

      if (sinceDate && approvalDate < sinceDate) return;

      laws.push({
        lawNumber: lawNumText,
        title: titleText || lawNumText,
        approvalDate,
        sourceUrl: link ? `${CONGRESS_BASE_URL}${link}` : `${CONGRESS_BASE_URL}/decretos`,
      });
    });

    return laws;
  } finally {
    await browser.close();
  }
}

export async function fetchCongressmen(): Promise<CongressmanRecord[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${CONGRESS_BASE_URL}/diputados`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });

    const html = await page.content();
    const $ = cheerio.load(html);
    const congressmen: CongressmanRecord[] = [];

    $(".diputado-card, .deputy-item, tr.diputado").each((_, el) => {
      const $el = $(el);
      const name =
        $el.find(".nombre, .name, td:nth-child(1)").text().trim();
      const party =
        $el.find(".partido, .party, td:nth-child(2)").text().trim();
      const district =
        $el.find(".departamento, .district, td:nth-child(3)").text().trim();
      const photoUrl =
        $el.find("img").attr("src");

      if (!name) return;

      congressmen.push({
        name,
        party: party || "Independiente",
        district: district || "Honduras",
        photoUrl: photoUrl
          ? photoUrl.startsWith("http")
            ? photoUrl
            : `${CONGRESS_BASE_URL}${photoUrl}`
          : undefined,
      });
    });

    return congressmen;
  } finally {
    await browser.close();
  }
}

export async function fetchVotingRecord(
  lawNumber: string,
  lawUrl: string
): Promise<VotingRecord[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(lawUrl, { waitUntil: "networkidle", timeout: 30_000 });

    const html = await page.content();
    const $ = cheerio.load(html);
    const records: VotingRecord[] = [];

    $(".votacion tr, .voting-record tr").each((_, el) => {
      const $el = $(el);
      const name = $el.find("td:nth-child(1)").text().trim();
      const party = $el.find("td:nth-child(2)").text().trim();
      const voteText = $el.find("td:nth-child(3)").text().trim().toUpperCase();

      if (!name) return;

      let vote: VotingRecord["vote"] = "ABSENT";
      if (voteText.includes("FAVOR") || voteText === "SI" || voteText === "SÍ") vote = "FOR";
      else if (voteText.includes("CONTRA") || voteText === "NO") vote = "AGAINST";
      else if (voteText.includes("ABSTENCI")) vote = "ABSTAIN";

      records.push({ lawNumber, congressmanName: name, party, vote });
    });

    return records;
  } finally {
    await browser.close();
  }
}
