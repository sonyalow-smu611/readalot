import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:5174"
  },
  webServer: [
    {
      // no Google Books key and no Supabase: the tests rely on the built-in demo shelf, held in
      // memory. Sign-in still uses the real Supabase project, from the browser.
      command: "PORT=3100 GOOGLE_BOOKS_API_KEY= SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= pnpm --filter readalot-server dev",
      url: "http://127.0.0.1:3100/api/health",
      reuseExistingServer: false
    },
    {
      // the same API with Supabase on, for friends.spec.js and nearby.spec.js (useRealApi in fixtures.js)
      command: "PORT=3101 GOOGLE_BOOKS_API_KEY= pnpm --filter readalot-server dev",
      url: "http://127.0.0.1:3101/api/health",
      reuseExistingServer: false
    },
    {
      command: "VITE_API_TARGET=http://127.0.0.1:3100 pnpm --filter readalot-client dev --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: false
    }
  ]
});
