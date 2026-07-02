/**
 * 管理画面 商品管理「カテゴリ CSV 出力」E2E。
 * 納品ケース表 integration_test/e2e/m03_12_admin_product_product_category_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV本文の列・行・集計値）・対象外（ログ抑止・リクエスト検証なし等）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-12_admin_product_product_category_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。刷新先 ec-cube-enterprise の同等ルート
 * admin_product_category_export（CategoryController.php:519 / category.twig:243）の存在を確認済み。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。CSV本文検査はシードと手動工程が要るためケース表(付帯表3)で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductCategoryCsvExportPage } from "../../../pages/admin/m03/m03_12_admin_product_product_category_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書 処理フロー#10「filename=category_YYYYMMDDhhmmss.csv」が一次根拠（CategoryController.php:573-575はルート実在確認の補助）。実装に合わせて変えない（オラクル独立性）。
const FILENAME_RE = /^category_\d{14}\.csv$/; // category_YYYYMMDDhhmmss.csv（日時はリクエスト時刻で動的のため正規表現照合）
const CATEGORY_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/category(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > カテゴリ CSV 出力",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M03-12-020 未ログインでエクスポートURL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new ProductProductCategoryCsvExportPage(page);
      await page.goto(p.exportPath);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M03-12-001 カテゴリ一覧に「CSVダウンロード」リンクが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCategoryCsvExportPage(page);
        await p.gotoList();
        await expect(p.csvDownloadLink).toBeVisible();
      });

      test("E2E-M03-12-002 カテゴリ一覧に「CSV出力項目設定」リンクが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCategoryCsvExportPage(page);
        await p.gotoList();
        await expect(p.csvSettingLink).toBeVisible();
      });

      test("E2E-M03-12-003 カテゴリ編集画面でも「CSVダウンロード」リンクが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductCategoryCsvExportPage(page);
        // 設計書 入口節「編集時も右上に同じCSVダウンロードリンクが出る」。出力リンクはヘッダブロックでedit分岐の外（category.twig:241-253 / 260）。
        await p.gotoFirstCategoryEdit();
        await expect(p.csvDownloadLink).toBeVisible();
      });

      test("E2E-M03-12-050 ダウンロード後も認証セッションが維持され再ログインを要しない", async ({ page }) => {
        await login(page);
        const p = new ProductProductCategoryCsvExportPage(page);
        await p.gotoList();
        await p.downloadCsv();
        // セッション「更新しない」・Cookie「新たなCookieを設定しない」の間接観測：認証必須画面へ再アクセスしログインへ戻らないこと。
        await p.gotoList();
        await expect(page).not.toHaveURL(LOGIN_RE);
        await expect(p.csvDownloadLink).toBeVisible();
      });

      test("E2E-M03-12-010 「CSVダウンロード」押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new ProductProductCategoryCsvExportPage(page);
        await p.gotoList();
        const download = await p.downloadCsv();
        expect(download).toBeTruthy(); // download イベントが発火（HTML一覧へ遷移しない）
      });

      test("E2E-M03-12-011 ダウンロードファイル名が category_<日時>.csv 形式である", async ({ page }) => {
        await login(page);
        const p = new ProductProductCategoryCsvExportPage(page);
        await p.gotoList();
        const download = await p.downloadCsv();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M03-12-012 エクスポートURL直接GETでダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new ProductProductCategoryCsvExportPage(page);
        // 添付応答へのナビゲーションは download イベントになり goto は中断され得るため握りつぶす。
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.goto(p.exportPath).catch(() => null),
        ]);
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M03-12-013 エクスポート応答が添付ファイルのHTTPヘッダを返す", async ({ page }) => {
        await login(page);
        const p = new ProductProductCategoryCsvExportPage(page);
        // 認証済みブラウザコンテキストのCookieを共有する request で応答ヘッダを観測する。
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(200);
        const headers = res.headers();
        expect(headers["content-type"]).toContain("application/octet-stream");
        expect(headers["content-disposition"]).toContain("attachment");
        expect(headers["content-disposition"]).toMatch(/filename=category_\d{14}\.csv/);
      });

      test("E2E-M03-12-030 ダウンロード押下後も確認ダイアログを介さず一覧に留まる", async ({ page }) => {
        await login(page);
        const p = new ProductProductCategoryCsvExportPage(page);
        await p.gotoList();
        // 出力前の確認ダイアログは無い仕様。dialog が出たら検出して失敗させる。
        let dialogShown = false;
        page.on("dialog", async (d) => {
          dialogShown = true;
          await d.dismiss();
        });
        await p.downloadCsv();
        expect(dialogShown).toBe(false);
        await expect(page).toHaveURL(CATEGORY_LIST_RE); // 一覧HTMLに留まる（同一タブのGETダウンロード）
      });
    });
  }
);
