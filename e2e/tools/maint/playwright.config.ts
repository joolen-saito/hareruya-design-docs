/** 保守用の画面操作（ケースではない）。エビデンスは出さない。tools/remove_products.sh から流す */
import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export default defineConfig({
  testDir: ".",
  testMatch: /.*\.maint\.ts$/,
  workers: 1,
  retries: 0,
  timeout: 600_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  outputDir: "../../.runs/maint-results",
  use: { baseURL: BASE_URL, ignoreHTTPSErrors: true, locale: "ja-JP" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], locale: "ja-JP" } }],
});
