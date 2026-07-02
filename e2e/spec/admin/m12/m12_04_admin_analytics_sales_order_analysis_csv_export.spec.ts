/**
 * 管理画面 受注売上分析 CSVダウンロード（M12-04）E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m12_04_admin_analytics_sales_order_analysis_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装する。
 * CSV内容（ヘッダ行・列順・平均単価計算・全件出力・BOM）・集計の同一性・検索条件相関・出力失敗(共通例外)・権限不足は
 * ブラウザ観測外/再現困難のため「手動」「対象外」としケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 自動化予定だが要確認/未実装は test.fixme（理由付き）で抜け漏れを可視化する。
 * 期待結果は仕様（正本 functions/pf-eccube3/m12-04_admin_analytics_sales_order_analysis_csv_export.md / 観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（HareruyaEc リバース）。刷新先 ec-cube-enterprise との乖離（検索条件セッション空時の挙動・
 * ヘッダ「商品」/「商品コード」差異・Content-Type）はケース表「付帯表4」に出し、テストは仕様どおりに書く。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m11系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 本機能は参照・出力のみ（DB無更新）。検索(POST)→CSV出力(GET)は安全に実行できる。
 *  - 「CSVダウンロードリンク表示」「リンク押下→ダウンロード」は集計結果に行が必要（SEED-M12-04-ORDER）。
 *    リンク非依存の HTTP 取得（requestExport）は検索実行済みなら 0 件でも成立する。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalyticsSalesOrderAnalysisCsvExportPage } from "../../../pages/admin/m12/m12_04_admin_analytics_sales_order_analysis_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  // ログイン後の遷移完了（認証 Cookie 確立）を待ってから次操作へ進む。
  // 直後に別URLへ goto する設計のため、ログインURLを離脱したことを確認して不安定化を防ぐ。
  await expect(page).not.toHaveURL(LOGIN_RE);
}

test.describe(
  "管理画面 > 受注売上分析 > CSVダウンロード",
  { tag: ["@admin", "@analysis"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M12-04-010 未ログインでCSV出力URL直接→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様（権限・認可：未ログイン管理者はアクセス不可／エラー処理：認証不足は出力しない）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/analysis/sales/export`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 集計実行→CSV出力（HAS_CREDS・非破壊） =====

    test("E2E-M12-04-004 検索実行後にCSV出力URLを取得するとCSVファイルが応答される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AnalyticsSalesOrderAnalysisCsvExportPage(page);
      await csv.search(); // 検索条件セッションを確立（仕様：直前の集計と同条件）
      const res = await csv.requestExport();
      // 仕様（利用者視点の入口：CSVとして出力する）。HTTP 成功で取得できること。
      expect(res.ok()).toBeTruthy();
    });

    test("E2E-M12-04-005 CSV出力応答が添付ファイルとして返る（Content-Disposition: attachment）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AnalyticsSalesOrderAnalysisCsvExportPage(page);
      await csv.search();
      const res = await csv.requestExport();
      const disposition = res.headers()["content-disposition"] ?? "";
      // 仕様（入出力：成功時出力はCSVファイル＝ダウンロード）。添付ファイルとして応答されること。
      expect(disposition).toContain("attachment");
    });

    test("E2E-M12-04-003 CSV出力のファイル名が sales_report_<出力日時>.csv 形式である", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AnalyticsSalesOrderAnalysisCsvExportPage(page);
      await csv.search();
      const res = await csv.requestExport();
      const disposition = res.headers()["content-disposition"] ?? "";
      // 仕様（入出力：ファイル名は sales_report_ に出力日時(YmdHis)を付けた .csv）。
      const m = disposition.match(/filename=([^;]+)/);
      const filename = (m?.[1] ?? "").replace(/["']/g, "").trim();
      expect(filename).toMatch(AnalyticsSalesOrderAnalysisCsvExportPage.FILENAME_RE);
    });

    // ===== 一覧UI（HAS_CREDS＋集計結果に行が必要：SEED-M12-04-ORDER） =====

    test("E2E-M12-04-001 集計結果一覧で検索実行後に「CSVダウンロード」リンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const csv = new AnalyticsSalesOrderAnalysisCsvExportPage(page);
      await login(page);
      await csv.search();
      test.skip(
        (await csv.resultList.count()) === 0,
        "集計結果0件のため CSVダウンロードリンク非表示（SEED-M12-04-ORDER 未投入）"
      );
      // 仕様（利用者視点の入口：集計結果一覧にCSVダウンロードのリンクが表示される）。
      await csv.seeExportLink();
    });

    test("E2E-M12-04-002 「CSVダウンロード」リンク押下でダウンロードが発火し画面遷移しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const csv = new AnalyticsSalesOrderAnalysisCsvExportPage(page);
      await login(page);
      await csv.search();
      test.skip(
        (await csv.resultList.count()) === 0,
        "集計結果0件のため CSVダウンロードリンク非表示（SEED-M12-04-ORDER 未投入）"
      );
      const urlBefore = page.url();
      const download = await csv.downloadViaLink();
      // 仕様（フロント挙動・画面遷移：画面遷移を伴わずCSVを出力する）。
      expect(page.url()).toBe(urlBefore);
      // 仕様（入出力：成功時出力はCSVファイル sales_report_*.csv）。
      expect(download.suggestedFilename()).toMatch(
        AnalyticsSalesOrderAnalysisCsvExportPage.FILENAME_RE
      );
    });

    test("E2E-M12-04-006 「CSVダウンロード」リンク押下でCSVファイルのダウンロードが発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const csv = new AnalyticsSalesOrderAnalysisCsvExportPage(page);
      await login(page);
      await csv.search();
      test.skip(
        (await csv.resultList.count()) === 0,
        "集計結果0件のため CSVダウンロードリンク非表示（SEED-M12-04-ORDER 未投入）"
      );
      // 仕様（利用者視点の入口・フロント挙動：リンク押下でCSVファイルのダウンロードが発火する）。
      const download = await csv.downloadViaLink();
      expect(download.suggestedFilename()).toMatch(
        AnalyticsSalesOrderAnalysisCsvExportPage.FILENAME_RE
      );
    });

    test("E2E-M12-04-007 CSVダウンロード押下で確認モーダル/ダイアログを表示せずダウンロードが発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const csv = new AnalyticsSalesOrderAnalysisCsvExportPage(page);
      await login(page);
      await csv.search();
      test.skip(
        (await csv.resultList.count()) === 0,
        "集計結果0件のため CSVダウンロードリンク非表示（SEED-M12-04-ORDER 未投入）"
      );
      // 仕様（フロント挙動：本機能専用のモーダルは無い／画面遷移は伴わない）。
      // JS確認ダイアログ（confirm/alert）が発火しないことを監視する。発火したら検出して失敗させる。
      let dialogShown = false;
      page.on("dialog", (d) => {
        dialogShown = true;
        void d.dismiss();
      });
      const urlBefore = page.url();
      const download = await csv.downloadViaLink();
      expect(dialogShown).toBe(false);
      // 画面遷移を伴わずダウンロードが発火すること（仕様 フロント挙動・画面遷移）。
      expect(page.url()).toBe(urlBefore);
      expect(download.suggestedFilename()).toMatch(
        AnalyticsSalesOrderAnalysisCsvExportPage.FILENAME_RE
      );
    });

    // ===== 保留（要確認・未実装。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M12-04-011 検索条件セッションが空でCSV出力→【仕様】空条件で集計しCSVを出力（刷新先は一覧へリダイレクト＝付帯表4#1の乖離検出）",
      async ({ page }) => {
        // 期待は仕様（エラー処理：検索条件セッションが空でも空の検索条件で集計し出力する）由来。
        // ログイン直後（検索未実行＝セッション空）で CSV 出力URLへ直接アクセスし、CSVが出力されることを検証する。
        // 刷新先 ec-cube-enterprise は admin_analysis_sales へリダイレクトし「検索条件がありません。...」を表示する
        // （SalesAnalysisController.php:100-105）ため、本specは刷新先実装では落ちて乖離を検出する。
        // どちらを刷新後の正とするか要確認のため、確定するまで fixme で保留（実装へは寄せない）。
        await login(page);
        const csv = new AnalyticsSalesOrderAnalysisCsvExportPage(page);
        const res = await csv.requestExport();
        // 仕様: 空条件で集計したCSVが添付ファイルとして出力されること（HTTP成功・attachment・ファイル名）。
        expect(res.ok()).toBeTruthy();
        const disposition = res.headers()["content-disposition"] ?? "";
        expect(disposition).toContain("attachment");
        const m = disposition.match(/filename=([^;]+)/);
        const filename = (m?.[1] ?? "").replace(/["']/g, "").trim();
        expect(filename).toMatch(
          AnalyticsSalesOrderAnalysisCsvExportPage.FILENAME_RE
        );
      }
    );
  }
);
