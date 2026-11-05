import { defineConfig, devices } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT || "3110";
const realApiPort = process.env.PLAYWRIGHT_REAL_API_PORT || "3111";
const clientPort = process.env.PLAYWRIGHT_CLIENT_PORT || "5175";
const apiUrl = `http://127.0.0.1:${apiPort}`;
const realApiUrl = `http://127.0.0.1:${realApiPort}`;
const clientUrl = `http://127.0.0.1:${clientPort}`;

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: clientUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    },
    {
      name: "iphone-13",
      use: { ...devices["iPhone 13"] }
    }
  ],
  webServer: [
    {
      // no Google Books key and no Supabase: the tests rely on the built-in demo shelf, held in
      // memory. Sign-in still uses the real Supabase project, from the browser.
<<<<<<< HEAD
      command: `PORT=${apiPort} GOOGLE_BOOKS_API_KEY= SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= npm --workspace server run dev`,
      url: `${apiUrl}/api/health`,
=======
      command: "PORT=3100 GOOGLE_BOOKS_API_KEY= SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= pnpm --filter readalot-server dev",
      url: "http://127.0.0.1:3100/api/health",
>>>>>>> 22089cbc926a5705b6acaa2bb48b9d8071474b86
      reuseExistingServer: false
    },
    {
      // the same API with Supabase on, for friends.spec.js and nearby.spec.js (useRealApi in fixtures.js)
<<<<<<< HEAD
      command: `PORT=${realApiPort} GOOGLE_BOOKS_API_KEY= npm --workspace server run dev`,
      url: `${realApiUrl}/api/health`,
      reuseExistingServer: false
    },
    {
      command: `VITE_API_TARGET=${apiUrl} npm --workspace client run dev -- --host 127.0.0.1 --port ${clientPort} --strictPort`,
      url: clientUrl,
=======
      command: "PORT=3101 GOOGLE_BOOKS_API_KEY= pnpm --filter readalot-server dev",
      url: "http://127.0.0.1:3101/api/health",
      reuseExistingServer: false
    },
    {
      command: "VITE_API_TARGET=http://127.0.0.1:3100 pnpm --filter readalot-client dev --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
>>>>>>> 22089cbc926a5705b6acaa2bb48b9d8071474b86
      reuseExistingServer: false
    }
  ]
});
