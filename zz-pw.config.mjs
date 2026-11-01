import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e", testMatch: process.env.ZZ_MATCH || "zz-repro.spec.js",
  use: { baseURL: "http://127.0.0.1:5274" },
  webServer: [
    { command: "PORT=3200 GOOGLE_BOOKS_API_KEY= SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= npm --workspace server run dev", url: "http://127.0.0.1:3200/api/health", reuseExistingServer: true },
    { command: "VITE_API_TARGET=http://127.0.0.1:3200 npm --workspace client run dev -- --host 127.0.0.1 --port 5274 --strictPort", url: "http://127.0.0.1:5274", reuseExistingServer: true },
  ],
});
