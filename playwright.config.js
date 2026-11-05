// Scaffolded with AI assistance — see AI_USAGE.md
import { defineConfig, devices } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT || "3110";
const realApiPort = process.env.PLAYWRIGHT_REAL_API_PORT || "3111";
const clientPort = process.env.PLAYWRIGHT_CLIENT_PORT || "5175";
const apiUrl = `http://127.0.0.1:${apiPort}`;
const realApiUrl = `http://127.0.0.1:${realApiPort}`;
const clientUrl = `http://127.0.0.1:${clientPort}`;

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/features/*.spec.js",
  workers: 1,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: process.env.FEATURE_RESULTS_FILE || "test-results/features-results.json" }]],
  use: {
    baseURL: clientUrl,
    actionTimeout: 10_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    },
    {
      name: "iphone",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" }
    }
  ],
  webServer: [
    {
      // Demo shelf API; browser sign-in still uses the configured Supabase project.
      command: `PORT=${apiPort} GOOGLE_BOOKS_API_KEY= SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= pnpm --filter readalot-server start`,
      url: `${apiUrl}/api/health`,
      reuseExistingServer: false
    },
    {
      // Supabase-backed API for persistent friendships and personal-space tests.
      command: `PORT=${realApiPort} GOOGLE_BOOKS_API_KEY= pnpm --filter readalot-server start`,
      url: `${realApiUrl}/api/health`,
      reuseExistingServer: false
    },
    {
      command: `VITE_API_TARGET=${apiUrl} pnpm --filter readalot-client dev --host 127.0.0.1 --port ${clientPort} --strictPort`,
      url: clientUrl,
      reuseExistingServer: false
    }
  ]
});
