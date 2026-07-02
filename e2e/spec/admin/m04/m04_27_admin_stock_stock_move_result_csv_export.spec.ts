/**
 * 管理画面 在庫管理「在庫移動実績入力用CSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m04_27_admin_stock_stock_move_result_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV本文＝4列固定ヘッダー・データ行なし・文字コードSJIS-win/UTF-8時BOM）・
 * 対象外（CSRFなしGET・参照のみのDB無更新・ログ出力抑止・入力フォーム/バリデーション非該当・出力失敗分岐なし）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-27_admin_stock_stock_move_result_csv_export.md
 *   / 基本設計仕様書(在庫管理機能))由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 刷新先 ec-cube-enterprise の同等ルート admin_stock_move_instruction_csv_download_record
 *   （StockMoveInstructionController.php:334 / stock_move_instruction_index.twig:160）の存在を確認済み。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。出力リンク経由(001/010/016/017)は検索実行後にリンクが描画される（index.twig:157）ため
 *   在庫移動指示が1件以上存在するシード(SEED-M04-27-INSTRUCTION)を要する。検索条件UIは別機能設計が正のため
 *   runSearch() は要実機確認。シード/検索が前提のリンク経由ケースは test.fixme で抜け漏れ可視化する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockMoveResultCsvExportPage } from "../../../pages/admin/m04/m04_27_admin_stock_stock_move_result_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書「CSV出力仕様」由来（filename=stock_move_instruction_record_template_<YmdHis>.csv）。
// 実装に合わせて変えない（オラクル独立性）。日時はリクエスト時刻で動的のため正規表現照合。
const FILENAME_RE = /^stock_move_instruction_record_template_\d{14}\.csv$/;
const FILENAME_HEADER_RE =
  /filename=stock_move_instruction_record_template_\d{14}\.csv/;
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 在庫移動実績入力用CSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-27-020 未ログインでCSV出力URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockMoveResultCsvExportPage(page);
      await page.goto(p.exportPath);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M04-27-012 CSV出力URL直接GETでダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveResultCsvExportPage(page);
        // 添付応答へのナビゲーションは download イベントになり goto は中断され得るため握りつぶす。
        // 012のオラクルは「ダウンロードが発火すること」(IT-13・利用者視点の入口GET)。
        // ファイル名形式の照合は011で行い、ここでは発火＝CSVが取得されることのみ確認する。
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.goto(p.exportPath).catch(() => null),
        ]);
        expect(download).toBeTruthy();
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      });

      test("E2E-M04-27-011 ダウンロードファイル名が stock_move_instruction_record_template_<日時>.csv 形式である", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockMoveResultCsvExportPage(page);
        // 011のオラクルは設計書「CSV出力仕様＞ファイル名」由来のファイル名形式照合。
        // リンク経由（一覧→検索→押下）のファイル名は010(fixme)で担保し、ここはルート不問の
        // ファイル名形式を直接GETで検証する（ファイル名はルートに依存しない設計値のため）。
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.goto(p.exportPath).catch(() => null),
        ]);
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M04-27-013 CSV出力応答がHTTP200を返す", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveResultCsvExportPage(page);
        // 認証済みブラウザコンテキストのCookieを共有する request で応答ヘッダを観測する。
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(200);
      });

      test("E2E-M04-27-014 CSV出力応答のContent-Typeが text/csv である", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveResultCsvExportPage(page);
        const res = await page.request.get(p.exportPath);
        expect(res.headers()["content-type"]).toContain("text/csv");
      });

      test("E2E-M04-27-015 CSV出力応答が attachment; filename=stock_move_instruction_record_template_<日時>.csv を返す", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockMoveResultCsvExportPage(page);
        const res = await page.request.get(p.exportPath);
        const cd = res.headers()["content-disposition"] || "";
        expect(cd).toContain("attachment");
        expect(cd).toMatch(FILENAME_HEADER_RE);
      });

      test("E2E-M04-27-021 ログアウト/セッション無効化後はCSV出力URLが管理ログイン画面へ誘導される", async ({
        page,
        context,
      }) => {
        // 期待は仕様（権限・認可「管理ログインを要する」/ IT-15 状態変化：認証状態が変化した場合
        //   旧セッションでは保護対象を継続利用できない）由来。実装のログアウトルート文言は期待値化しない。
        await login(page);
        const p = new StockStockMoveResultCsvExportPage(page);
        // 認証済みでは出力URLが配信される（雛形ダウンロードが発火）ことを先に確認。
        const ok = await page.request.get(p.exportPath);
        expect(ok.status()).toBe(200);
        // セッションを無効化（ログアウト/期限切れ相当＝認証Cookie破棄）する。
        await context.clearCookies();
        // 無効化後の出力URLは雛形を配信せず管理ログイン画面へ誘導される。
        await page.goto(p.exportPath);
        await expect(page).toHaveURL(LOGIN_RE);
        await expect(page.locator("#login_id")).toBeVisible();
      });

      // ===== 出力リンク経由（検索実行でリンク描画＝SEED-M04-27-INSTRUCTION 要・検索UIは要実機確認） =====

      test.fixme(
        "E2E-M04-27-001 検索実行後の一覧に「在庫移動実績入力用CSVダウンロード」リンクが表示される（要: 在庫移動指示シード＋検索UI実機確認）",
        async ({ page }) => {
          // 期待は仕様(利用者視点の入口・stock_move_instruction_index.twig:157-162 pagination条件)由来。
          await login(page);
          const p = new StockStockMoveResultCsvExportPage(page);
          await p.gotoList();
          await p.runSearch();
          await p.seeDownloadLink();
        }
      );

      test.fixme(
        "E2E-M04-27-010 ダウンロードリンク押下でCSVダウンロードが発火する（要: 在庫移動指示シード＋検索UI実機確認）",
        async ({ page }) => {
          // 期待は仕様(プロセスフロー1-5)由来。
          await login(page);
          const p = new StockStockMoveResultCsvExportPage(page);
          await p.gotoList();
          await p.runSearch();
          const download = await p.downloadCsv();
          expect(download.suggestedFilename()).toMatch(FILENAME_RE);
        }
      );

      test.fixme(
        "E2E-M04-27-016 ダウンロード時に確認ダイアログを介さない（要: 在庫移動指示シード＋検索UI実機確認）",
        async ({ page }) => {
          // 期待は仕様(プロセスフロー＝確認ダイアログなし)由来。
          await login(page);
          const p = new StockStockMoveResultCsvExportPage(page);
          await p.gotoList();
          await p.runSearch();
          let dialogShown = false;
          page.on("dialog", async (d) => {
            dialogShown = true;
            await d.dismiss();
          });
          await p.downloadCsv();
          expect(dialogShown).toBe(false);
        }
      );

      test.fixme(
        "E2E-M04-27-017 ダウンロード押下後も在庫移動指示一覧に留まる（要: 在庫移動指示シード＋検索UI実機確認）",
        async ({ page }) => {
          // 期待は仕様(画面遷移＝GETダウンロードは画面遷移しない)由来。
          await login(page);
          const p = new StockStockMoveResultCsvExportPage(page);
          await p.gotoList();
          await p.runSearch();
          await p.downloadCsv();
          const LIST_RE = new RegExp(
            `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction(\\?|$)`
          );
          await expect(page).toHaveURL(LIST_RE);
        }
      );

      // 注: E2E-M04-27-040/041/042（CSV本文＝4列固定ヘッダー・データ行なし・文字コード/BOM）は
      //   手動ケースのためspecに残さない（規約「手動/対象外はspecに残さない」）。ケース表(付帯表1/3)で全量管理する。
    });
  }
);
