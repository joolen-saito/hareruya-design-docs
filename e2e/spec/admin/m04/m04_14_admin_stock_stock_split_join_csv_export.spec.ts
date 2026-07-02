/**
 * 管理画面 在庫管理「在庫分割結合情報CSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m04_14_admin_stock_stock_split_join_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV本文＝固定12列見出し・全件・s.id 昇順・分割/結合タイプ表示名・
 * 店舗/在庫区分・基準価格合計の四捨五入整数・登録日時 Y/m/d H:i・登録者氏名・0件時ヘッダ行のみ・文字コード SJIS-win）・
 * 対象外（CSRFなしGET・log_info のサーバログ・参照のみのDB内部値・入力フォーム/バリデーションなし）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-14_admin_stock_stock_split_join_csv_export.md
 *   / 基本設計仕様書(在庫管理機能))由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 刷新先 ec-cube-enterprise の同等ルート admin_stock_split_join_csv_export
 *   （StockSplitJoinController.php:210 / stock_split_join_index.twig:292）の存在を確認済み。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。出力リンク表示(001/010/030/031)は検索実行後のみ表示（index.twig:291）のため
 * 一覧の検索フォームを実際に送信して「検索実行後」状態を作る（仕様「検索を実行する」に忠実／POMの
 * gotoListWithSearchPerformed で検索ボタン送信。?resume 等の実装由来クエリには依存しない）。
 * CSV本文・検索条件連動・全件・並び順・0件はケース表(付帯表3)で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockSplitJoinCsvExportPage } from "../../../pages/admin/m04/m04_14_admin_stock_stock_split_join_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書「整形・ファイル仕様」由来（filename=stock_split_join_<YmdHis>.csv）。
// 実装に合わせて変えない（オラクル独立性）。日時はリクエスト時刻で動的のため正規表現照合。
const FILENAME_RE = /^stock_split_join_\d{14}\.csv$/;
const FILENAME_HEADER_RE = /filename=stock_split_join_\d{14}\.csv/;
// 「一覧画面に留まる」検証用。末尾が split-join 直後で終端/クエリ/フラグメントの場合のみ一致させ、
// 下位パス（/csv-export 等）を誤って一致させない（一覧URL限定）。
const LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/split-join(?:[?#]|$)`
);
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  // ログイン送信後の遷移完了を待つ（後続のナビゲーション/リクエストがログイン前に走るのを防ぐ）。
  await expect(page).not.toHaveURL(LOGIN_RE);
}

test.describe(
  "管理画面 在庫管理 > 在庫分割結合情報CSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-14-020 未ログインでCSV出力URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockSplitJoinCsvExportPage(page);
      await page.goto(p.exportPath);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M04-14-001 検索実行後の一覧に「在庫分割結合CSV出力」リンクが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvExportPage(page);
        await p.gotoListWithSearchPerformed(); // 検索実行後のみリンク表示（index.twig:291）
        await expect(p.csvExportLink).toBeVisible();
      });

      test("E2E-M04-14-010 「在庫分割結合CSV出力」押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvExportPage(page);
        await p.gotoListWithSearchPerformed();
        const download = await p.downloadCsv();
        expect(download).toBeTruthy(); // download イベントが発火（一覧HTMLへ遷移しない）
      });

      test("E2E-M04-14-011 ダウンロードファイル名が stock_split_join_<日時>.csv 形式である", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvExportPage(page);
        await p.gotoListWithSearchPerformed();
        const download = await p.downloadCsv();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M04-14-012 CSV出力URL直接GETでダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvExportPage(page);
        // 添付応答へのナビゲーションは download イベントになり goto は中断され得るため握りつぶす。
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.goto(p.exportPath).catch(() => null),
        ]);
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M04-14-013 CSV出力応答がHTTP200を返す", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvExportPage(page);
        // 認証済みブラウザコンテキストのCookieを共有する request で応答ヘッダを観測する。
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(200);
      });

      test("E2E-M04-14-014 CSV出力応答のContent-Typeが application/octet-stream", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvExportPage(page);
        const res = await page.request.get(p.exportPath);
        expect(res.headers()["content-type"]).toContain("application/octet-stream");
      });

      test("E2E-M04-14-015 CSV出力応答が attachment; filename=stock_split_join_<日時>.csv を返す", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvExportPage(page);
        const res = await page.request.get(p.exportPath);
        const cd = res.headers()["content-disposition"] || "";
        expect(cd).toContain("attachment");
        expect(cd).toMatch(FILENAME_HEADER_RE);
      });

      test("E2E-M04-14-030 ダウンロード時に確認ダイアログを介さない", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvExportPage(page);
        await p.gotoListWithSearchPerformed();
        // 出力前の確認ダイアログは無い仕様。dialog が出たら検出して失敗させる。
        let dialogShown = false;
        page.on("dialog", async (d) => {
          dialogShown = true;
          await d.dismiss();
        });
        await p.downloadCsv();
        expect(dialogShown).toBe(false);
      });

      test("E2E-M04-14-031 ダウンロード押下後も一覧画面に留まる", async ({ page }) => {
        await login(page);
        const p = new StockStockSplitJoinCsvExportPage(page);
        await p.gotoListWithSearchPerformed();
        await p.downloadCsv();
        await expect(page).toHaveURL(LIST_RE); // 一覧HTMLに留まる（同一タブのGETダウンロード）
      });

      // 手動（CSV本文＝044の検索条件連動全件・空セッション全件・040-043）/対象外（045 log_info）は
      // 規約「手動/対象外はspecに残さない」に従い spec へ実装せず、ケース表(付帯表3・付帯表5)で全量管理する。
    });
  }
);
