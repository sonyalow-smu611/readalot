import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

export const env = {
  PORT: Number(process.env.PORT || 3000),
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GOOGLE_CLOUD_VISION_KEY: process.env.GOOGLE_CLOUD_VISION_KEY,
  DEMO_USER_ID: process.env.DEMO_USER_ID,
  API_NINJAS_KEY: process.env.API_NINJAS_KEY,
  NYT_BOOKS_API_KEY: process.env.NYT_BOOKS_API_KEY,
  WIKIMEDIA_ENTERPRISE_USERNAME: process.env.WIKIMEDIA_ENTERPRISE_USERNAME,
  WIKIMEDIA_ENTERPRISE_PASSWORD: process.env.WIKIMEDIA_ENTERPRISE_PASSWORD,
  // Demo sign-in: emails on these domains skip the emailed code (the code is always 111111). Unset
  // means the demo domain; set it empty to turn the feature off. See routes/demoAuth.js.
  DEMO_CODE_DOMAINS: (process.env.DEMO_CODE_DOMAINS ?? "demo.ikda.app")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean),
  HAS_SUPABASE: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
};
