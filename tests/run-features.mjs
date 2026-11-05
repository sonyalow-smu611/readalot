// Scaffolded with AI assistance — see AI_USAGE.md
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { hasSupabase, NEEDS_SUPABASE } from "./e2e/supabaseUser.js";

if (!hasSupabase) {
  process.stderr.write(`${NEEDS_SUPABASE}\nFeature acceptance tests require disposable authenticated readers; no tests were run.\n`);
  process.exit(1);
}

const require = createRequire(import.meta.url);
const cli = require.resolve("@playwright/test/cli");
let failed = false;
// Always attempt the phone run, even if desktop finds an application defect.
for (const project of ["desktop", "iphone"]) {
  const result = spawnSync(process.execPath, [
    cli, "test", "--config=playwright.config.js", `--project=${project}`,
    `--output=test-results/features-${project}`, ...process.argv.slice(2),
  ], {
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_HTML_OUTPUT_DIR: `playwright-report/features-${project}`,
      FEATURE_RESULTS_FILE: `test-results/features-${project}/results.json`,
    },
  });
  if (result.error) process.stderr.write(`${result.error.message}\n`);
  if (result.status !== 0) failed = true;
  if (result.signal === "SIGINT" || result.signal === "SIGTERM") process.exit(1);
}
process.exitCode = failed ? 1 : 0;
