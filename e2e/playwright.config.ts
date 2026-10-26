import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "./config/env";

/**
 * 結合テストケース（integration_test/casegen/all_test_cases.tsv）を実行する。
 * テストデータは画面から作るので、1ケースの時間は長い。機能ごとに分けて流す（npx playwright test spec/m13）。
 */
export default defineConfig({
  testDir: "./spec",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  // シードを画面から作る時間を含む（イベント31件を登録するケースがある）
  timeout: 900_000,
  expect: { timeout: 10_000 },
  // エビデンス（手順ごとの画面・確かめの合否）は evidence/ に書き出す（lib/evidence_reporter.ts）
  reporter: [["list"], ["html", { open: "never" }], ["./lib/evidence_reporter.ts"]],
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    locale: "ja-JP",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], acceptDownloads: true, locale: "ja-JP" } }],
});
