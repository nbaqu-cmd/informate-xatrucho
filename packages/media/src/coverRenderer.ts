import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import type { LawCoverProps } from "./templates/LawCover.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedBundle: string | null = null;

/** Bundles the Remotion project once and reuses it across cover renders. */
async function getBundle(): Promise<string> {
  if (cachedBundle) return cachedBundle;
  cachedBundle = await bundle({
    entryPoint: join(__dirname, "remotion-entry.tsx"),
    webpackOverride: (config) => config,
  });
  return cachedBundle;
}

/**
 * Renders a law's designed cover graphic to a PNG and returns the bytes. The
 * cover is generated entirely from the law's own data (decree number, topic,
 * category, date, constitutional verdict) — it identifies the law without
 * claiming to be a photograph of anything, so it can never mislead.
 */
export async function renderLawCover(props: LawCoverProps): Promise<Buffer> {
  const serveUrl = await getBundle();
  const composition = await selectComposition({ serveUrl, id: "LawCover", inputProps: props });

  const dir = mkdtempSync(join(tmpdir(), "informate-cover-"));
  const out = join(dir, "cover.png");
  try {
    await renderStill({
      composition,
      serveUrl,
      output: out,
      inputProps: props,
      imageFormat: "png",
    });
    return readFileSync(out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
