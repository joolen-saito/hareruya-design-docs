/**
 * 管理画面 日別/月別集計 CSVダウンロード E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m12_02_admin_analytics_sales_daily_monthly_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」で非破壊・安全に実行できるケースのみ test 本体で実装し、
 * 設計書と刷新先実装の乖離（ファイル名 report_summary_ ↔ summary_／セッション空時の挙動）は test.fixme（理由付き）で残す。
 * 手動（CSV内容・集計一致・障害注入）・対象外（入力フォームなし・DB内部・M12-01委譲）はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m12-02_..._csv_export.md／観点表）由来（オラクル独立性）。実装の現挙動を期待値に写さない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m11系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 本機能は参照・出力のみで業務データを更新しないため、全ケース非破壊で安全に実行できる。
 *  - 集計結果一覧／CSVダウンロードリンクは集計対象データが必要（前提：SEED-M12-02-SUMMARY）。データが無いと一覧が描画されない。
 *  - CSVファイルの中身（ヘッダ・データ行・集計一致・購買率%・会員数）は手動でケース表管理（csv_export方針＝内容は手動）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalyticsSalesDailyMonthlyCsvExportPage } from "../../../pages/admin/m12/m12_02_admin_analytics_sales_daily_monthly_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const EXPORT_PATH = `/${ECCUBE_ADMIN_ROUTE}/analysis/summary/export`;
const DAILY_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/analysis/summary/daily`);
// 仕様（権限・認可）の「管理ログイン画面へ誘導」を判定する。管理ルート配下のログインに限定し、
// 一般 /login など別画面で誤って通らないようにする（オラクルは仕様＝管理ログイン画面）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 分析・集計 > 日別/月別集計 CSVダウンロード",
  { tag: ["@admin", "@analysis", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M12-02-010 未ログインでCSV出力URL→管理ログイン画面へ誘導（出力しない）", async ({
      page,
    }) => {
      // 仕様（権限・認可：未ログイン管理者はアクセス不可／エラー処理：認証・権限不足は出力しない）。
      await page.goto(EXPORT_PATH);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 集計実行→CSV出力導線（HAS_CREDS＋集計対象データ・非破壊） =====

    test("E2E-M12-02-001 検索実行後に集計結果一覧へCSVダウンロードリンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlyCsvExportPage(page);
      await summary.searchDaily();
      // 仕様（利用者視点の入口：集計結果一覧にCSVダウンロードのリンクが表示される）。
      await summary.seeCsvLink();
    });

    test("E2E-M12-02-002 CSVダウンロード押下でCSVダウンロードが発火する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlyCsvExportPage(page);
      await summary.searchDaily();
      const download = await summary.downloadCsv();
      // 仕様（入出力：成功時出力は集計結果のCSVファイル）。発火と拡張子のみ観測（内容は手動）。
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });

    test("E2E-M12-02-004 CSVダウンロード時に画面遷移せず集計画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlyCsvExportPage(page);
      await summary.searchDaily();
      const urlBefore = page.url();
      await summary.downloadCsv();
      // 仕様（画面遷移：「CSVダウンロード」押下で画面遷移せずCSVを出力する）。
      expect(page.url()).toBe(urlBefore);
      // 集計画面（日次）に留まり、ログイン画面等へ遷移しないこと。
      await expect(page).toHaveURL(DAILY_RE);
      await expect(page).not.toHaveURL(LOGIN_RE);
    });

    test("E2E-M12-02-006 月別集計でも検索実行後にCSVダウンロードリンクが表示され押下で発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlyCsvExportPage(page);
      // 仕様（機能名「日別/月別集計」）：月別集計でも同一の出力導線・発火が成立すること。
      await summary.searchMonthly();
      await summary.seeCsvLink();
      const download = await summary.downloadCsv();
      // 内容は手動。発火と拡張子のみ観測（オラクルは仕様＝CSVファイル出力）。
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });

    test("E2E-M12-02-005 セッション保持状態でCSV出力URL直アクセスがHTTP200のCSV添付応答を返す", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const summary = new AnalyticsSalesDailyMonthlyCsvExportPage(page);
      // 先に検索を実行して検索条件セッションを確立（仕様：直前の集計実行で保存された検索条件セッションの値で出力）。
      await summary.searchDaily();
      // ブラウザ文脈のCookieを共有する request で出力URLを直接GETし、HTTP応答を観測する。
      const res = await page.request.get(EXPORT_PATH);
      expect(res.status()).toBe(200);
      const dispo = res.headers()["content-disposition"] || "";
      expect(dispo.toLowerCase()).toContain("attachment");
      expect(dispo).toMatch(/\.csv/);
    });

    // ===== 保留（仕様乖離・要確認。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M12-02-003 ダウンロードファイル名が設計書の report_summary_<YmdHis>.csv 形式（要確認：移行設計でファイル名確定）",
      async () => {
        // 期待は仕様（入出力：ファイル名は report_summary_ ＋ YmdHis ＋ .csv）由来。
        // 設計書はファイル名・BOM・ヘッダ行を「移行設計で確認」と明記（付帯表4#1）。
        // 刷新先実装は summary_<type>_<YmdHis>.csv（SummaryCsvExporterService.php:107）で乖離。確定後に実装する。
      }
    );

    test.fixme(
      "E2E-M12-02-011 検索条件セッションが空でCSV出力URL直アクセス→空条件で集計しCSV出力（仕様乖離・要確認）",
      async () => {
        // 期待は仕様（エラー処理：検索条件セッションが空 → 空の検索条件で集計し、出力する）由来。
        // 刷新先実装は「検索条件がありません。先に検索を実行してください。」を表示し日次集計画面へリダイレクト
        // （SummaryController.php:161-165）で乖離（付帯表4#2）。テストは仕様どおり（CSV出力）を期待。確定後に実装する。
      }
    );
  }
);
