/**
 * 管理画面 在庫管理「在庫移動・振替情報CSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m04_10_admin_stock_stock_move_transfer_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV本文＝14列見出し・全件・登録日降順→ID降順・移動タイプ/在庫区分/
 * ステータスの表示名・日時 Y/m/d H:i・基準価格合計の四捨五入整数・移動指示ID空欄・移動点数集計・対象0件時の見出しのみ）・
 * 対象外（CSRFなしGET・ログ出力抑止・参照のみのDB内部値・バッチ/JSON/コピー/削除/移動リネーム・入力境界）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-10_admin_stock_stock_move_transfer_csv_export.md
 *   / 基本設計仕様書(在庫管理機能))由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 刷新先 ec-cube-enterprise の同等ルート admin_stock_move_transfer_csv_export
 *   （StockMoveTransferController.php:413 / index.twig:627）の存在を確認済み。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。CSV本文・検索条件連動・全件はシードと手動工程が要るためケース表(付帯表3)で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockMoveTransferCsvExportPage } from "../../../pages/admin/m04/m04_10_admin_stock_stock_move_transfer_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書「出力ファイル・レスポンス」由来（filename=stock_move_transfer_list_{YmdHis}.csv）。
// 実装に合わせて変えない（オラクル独立性）。日時はリクエスト時刻で動的のため正規表現照合。
const FILENAME_RE = /^stock_move_transfer_list_\d{14}\.csv$/;
const FILENAME_HEADER_RE = /filename=stock_move_transfer_list_\d{14}\.csv/;
const LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer(\\?|$)`
);
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 在庫移動・振替情報CSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-10-020 未ログインでCSV出力URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockMoveTransferCsvExportPage(page);
      await page.goto(p.exportPath);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M04-10-001 一覧に「在庫移動振替CSV出力」リンクが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveTransferCsvExportPage(page);
        await p.gotoList();
        await expect(p.csvExportLink).toBeVisible();
      });

      test("E2E-M04-10-010 「在庫移動振替CSV出力」押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveTransferCsvExportPage(page);
        await p.gotoList();
        const download = await p.downloadCsv();
        expect(download).toBeTruthy(); // download イベントが発火（一覧HTMLへ遷移しない）
      });

      test("E2E-M04-10-011 ダウンロードファイル名が stock_move_transfer_list_<日時>.csv 形式である", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockMoveTransferCsvExportPage(page);
        await p.gotoList();
        const download = await p.downloadCsv();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M04-10-012 CSV出力URL直接GETでダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveTransferCsvExportPage(page);
        // 添付応答へのナビゲーションは download イベントになり goto は中断され得るため握りつぶす。
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.goto(p.exportPath).catch(() => null),
        ]);
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M04-10-013 CSV出力応答がHTTP200を返す", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveTransferCsvExportPage(page);
        // 認証済みブラウザコンテキストのCookieを共有する request で応答ヘッダを観測する。
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(200);
      });

      test("E2E-M04-10-014 CSV出力応答のContent-Typeが application/octet-stream", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveTransferCsvExportPage(page);
        const res = await page.request.get(p.exportPath);
        expect(res.headers()["content-type"]).toContain("application/octet-stream");
      });

      test("E2E-M04-10-015 CSV出力応答が attachment; filename=stock_move_transfer_list_<日時>.csv を返す", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockMoveTransferCsvExportPage(page);
        const res = await page.request.get(p.exportPath);
        const cd = res.headers()["content-disposition"] || "";
        expect(cd).toContain("attachment");
        expect(cd).toMatch(FILENAME_HEADER_RE);
      });

      test("E2E-M04-10-030 ダウンロード時に確認ダイアログを介さない", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveTransferCsvExportPage(page);
        await p.gotoList();
        // 出力前の確認ダイアログは無い仕様。dialog が出たら検出して失敗させる。
        let dialogShown = false;
        page.on("dialog", async (d) => {
          dialogShown = true;
          await d.dismiss();
        });
        await p.downloadCsv();
        expect(dialogShown).toBe(false);
      });

      test("E2E-M04-10-031 ダウンロード押下後も一覧画面に留まる", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveTransferCsvExportPage(page);
        await p.gotoList();
        await p.downloadCsv();
        await expect(page).toHaveURL(LIST_RE); // 一覧HTMLに留まる（同一タブのGETダウンロード）
      });

      // 注: E2E-M04-10-040/041/042/043（CSV本文＝14列見出し・全件・各列整形・0件時見出しのみ）は
      //   手動ケースのためspecに残さない（規約「手動/対象外はspecに残さない」）。ケース表(付帯表1/3)で全量管理する。
    });
  }
);
