import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:5174"
  },
  webServer: [
    {
      command: "PORT=3100 npm --workspace server run dev",
      url: "http://127.0.0.1:3100/api/health",
      reuseExistingServer: false
    },
    {
      command: "VITE_API_TARGET=http://127.0.0.1:3100 npm --workspace client run dev -- --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: false
    }
  ]
});
