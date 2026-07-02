import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL } from "./config/default.config";

/**
 * hareruya-design-docs 内の独立 E2E ランナー。
 * 稼働中の ec-cube-enterprise（ステージング/ローカル）を E2E_BASE_URL で指す。
 * 構造は ec-cube-enterprise/e2e-tests を踏襲。証明書が内部CA/自己署名のため ignoreHTTPSErrors を有効化。
 */
export default defineConfig({
  testDir: "./spec",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: E2E_BASE_URL,
    ignoreHTTPSErrors: true,
    locale: "ja-JP",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], acceptDownloads: true, locale: "ja-JP" },
    },
  ],
});
