import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// dotenv/config loads relative to process.cwd(), which breaks depending on where this
// process is launched from (root via turbo vs. directly inside apps/api). Resolve the
// monorepo root .env relative to this file's own location instead, so it works either way.
config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".env") });
