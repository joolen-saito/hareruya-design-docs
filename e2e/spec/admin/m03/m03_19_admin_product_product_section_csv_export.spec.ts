/**
 * 管理画面 商品管理「部門 CSV 出力」E2E。
 * 納品ケース表 integration_test/e2e/m03_19_admin_product_product_section_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV本文＝5列見出し・全件・部門コード昇順・免税区分の整数出力・
 * 表示フラグ1/0・UTF-8/BOM/区切り・0件時見出しのみ）・対象外（リクエスト検証なし・DB検索内部値・ログ抑止・CSRFなしGET）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-19_admin_product_product_section_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。刷新先 ec-cube-enterprise の同等ルート
 * admin_product_section_export（SectionController.php:199 / section.twig:44）の存在を確認済み。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。CSV本文検査はシードと手動工程が要るためケース表(付帯表3)で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSectionCsvExportPage } from "../../../pages/admin/m03/m03_19_admin_product_product_section_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書 処理フロー#7「filename=section_YYYYMMDDhhmmss.csv」が一次根拠（SectionController.php:224 はルート実在確認の補助）。
// 実装に合わせて変えない（オラクル独立性）。日時はリクエスト時刻で動的のため正規表現照合。
const FILENAME_RE = /^section_\d{14}\.csv$/;
const SECTION_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/section(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 部門 CSV 出力",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M03-19-020 未ログインでエクスポートURL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new ProductProductSectionCsvExportPage(page);
      await page.goto(p.exportPath);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M03-19-001 部門一覧に「CSV出力」リンクが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductSectionCsvExportPage(page);
        await p.gotoList();
        await expect(p.csvExportLink).toBeVisible();
      });

      test("E2E-M03-19-002 部門一覧に「CSV入力」リンクが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductSectionCsvExportPage(page);
        await p.gotoList();
        await expect(p.csvImportLink).toBeVisible();
      });

      test("E2E-M03-19-010 「CSV出力」押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new ProductProductSectionCsvExportPage(page);
        await p.gotoList();
        const download = await p.downloadCsv();
        expect(download).toBeTruthy(); // download イベントが発火（HTML一覧へ遷移しない）
      });

      test("E2E-M03-19-011 ダウンロードファイル名が section_<日時>.csv 形式である", async ({ page }) => {
        await login(page);
        const p = new ProductProductSectionCsvExportPage(page);
        await p.gotoList();
        const download = await p.downloadCsv();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M03-19-012 エクスポートURL直接GETでダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new ProductProductSectionCsvExportPage(page);
        // 添付応答へのナビゲーションは download イベントになり goto は中断され得るため握りつぶす。
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.goto(p.exportPath).catch(() => null),
        ]);
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M03-19-013 エクスポート応答が添付ファイルのHTTPヘッダを返す", async ({ page }) => {
        await login(page);
        const p = new ProductProductSectionCsvExportPage(page);
        // 認証済みブラウザコンテキストのCookieを共有する request で応答ヘッダを観測する。
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(200);
        const headers = res.headers();
        expect(headers["content-type"]).toContain("application/octet-stream");
        expect(headers["content-disposition"]).toContain("attachment");
        expect(headers["content-disposition"]).toMatch(/filename=section_\d{14}\.csv/);
      });

      test("E2E-M03-19-014 エクスポート応答で新規Cookie/セッションを設定しない", async ({ page, context }) => {
        // 設計書 セッション/Cookie 節: 本機能はセッションを更新せず新たな Cookie を設定しない。
        // Cookie名を期待値化せず（オラクル独立性）、出力前後で Cookie 集合が増えないことで判定する。
        await login(page);
        const p = new ProductProductSectionCsvExportPage(page);
        const before = await context.cookies();
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(200);
        const after = await context.cookies();
        expect(after.length).toBe(before.length); // 新Cookie非発行（仕様由来）
      });

      test("E2E-M03-19-015 任意クエリ付きGETでも全件CSVがダウンロードされる（クエリ無視）", async ({ page }) => {
        // 設計書 入出力 節: 検索条件や編集中フォーム値はエクスポートに渡らず常に全件。クエリ付与でも挙動は変わらない。
        await login(page);
        const p = new ProductProductSectionCsvExportPage(page);
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.goto(`${p.exportPath}?dummy=1&keyword=zzz`).catch(() => null),
        ]);
        expect(download.suggestedFilename()).toMatch(FILENAME_RE); // クエリに関わらず section_<日時>.csv
      });

      test("E2E-M03-19-030 ダウンロード押下後も確認ダイアログを介さず一覧に留まる", async ({ page }) => {
        await login(page);
        const p = new ProductProductSectionCsvExportPage(page);
        await p.gotoList();
        // 出力前の確認ダイアログは無い仕様。dialog が出たら検出して失敗させる。
        let dialogShown = false;
        page.on("dialog", async (d) => {
          dialogShown = true;
          await d.dismiss();
        });
        await p.downloadCsv();
        expect(dialogShown).toBe(false);
        await expect(page).toHaveURL(SECTION_LIST_RE); // 一覧HTMLに留まる（同一タブのGETダウンロード）
      });

      // ===== 部門編集画面でも同一テンプレートの「CSV出力」リンクが存在（実装済だが任意IDのシード前提） =====

      test.fixme(
        "E2E-M03-19-003 部門編集画面ヘッダにも同じ「CSV出力」リンクが表示される（要: 既存部門IDのシード）",
        async () => {
          // 期待は仕様(利用者視点の入口・編集画面でも同一CSV出力リンク)由来。
          // 既存部門ID（mtb_section に1件以上）を SEED-M03-19-SECTION で確定後、p.gotoEdit(id) で検証する。
        }
      );

      test.fixme(
        "E2E-M03-19-016 部門編集画面からCSV出力押下でダウンロードが発火する（要: 既存部門IDのシード）",
        async () => {
          // 期待は仕様(利用者視点の入口「編集画面でも同一CSVが返る」・入出力)由来。
          // SEED-M03-19-SECTION 確定後、p.gotoEdit(id)→p.downloadCsv() で
          // download 発火と suggestedFilename() が section_<日時>.csv 形式であることを検証する。
        }
      );
    });
  }
);
