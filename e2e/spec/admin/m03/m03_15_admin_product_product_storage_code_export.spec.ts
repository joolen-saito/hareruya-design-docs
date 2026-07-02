/**
 * 管理画面 商品管理「略称タグCSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m03_15_admin_product_product_storage_code_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。CSV内容（列 ID・名称・並び順／rank 昇順／登録済み全件）の照合や
 * 同時更新・スナップショットは手動であり、ケース表(付帯表2/2b)で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-15_admin_product_product_storage_code_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・ファイル名接頭辞・Content-Type は期待値に流用しない。
 *   - 設計書「処理フロー」: ファイル名は日時を含む → ファイル名は「日時(数字列)を含み拡張子が .csv」であることのみを期待。
 *     実装の接頭辞 storage_code_（StorageCodeController.php:188）はオラクル化しない（不具合候補/要確認 #1）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 *  未認証ガード(E2E-M03-15-004)のみ資格情報不要で常時実行可。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductStorageCodeExportPage } from "../../../pages/admin/m03/m03_15_admin_product_product_storage_code_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 略称タグ一覧URL（admin_product_storage_code = /<route>/product/storage）。押下後の滞留確認に使う。
const STORAGE_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/storage(/page/\\d+|/\\d+)?(\\?|$)`);
// ファイル名は日時を含む（設計書 処理フロー）。接頭辞・拡張子の実装値はオラクル化せず「数字列＋.csv」のみ期待。
const FILENAME_HAS_DATETIME = /\d{8,}.*\.csv$/;
// 管理ログイン画面のURL（admin_login = /<route>/login）。未認証ガードの「ログイン画面へ誘導」観点に使う。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 略称タグCSV出力",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要・常時実行可） =====

    test("E2E-M03-15-004 未ログインでCSV出力URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      // 仕様: 未ログイン管理者はアクセス不可・出力しない（権限・認可／エラー処理）。
      const p = new ProductProductStorageCodeExportPage(page);
      await page.goto(p.exportPath);
      await expect(page).toHaveURL(LOGIN_RE); // 管理ログイン画面へ誘導（URL観点）
      await expect(p.loginId).toBeVisible(); // ログイン画面へ誘導＝CSVは出力されない
    });

    // ===== 認証必須（CSV出力本体・UI部品） =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M03-15-001 略称タグ一覧に「CSV出力」リンクが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeExportPage(page);
        await p.gotoList();
        await expect(p.exportLink).toBeVisible(); // 操作起点（storage_code.twig:61-62）
      });

      test("E2E-M03-15-002 「CSV出力」押下でCSVダウンロードが発火し画面遷移しない", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeExportPage(page);
        await p.gotoList();
        const download = await p.exportViaLink();
        expect(download).toBeTruthy(); // ダウンロード発火（成功時出力）
        await expect(page).toHaveURL(STORAGE_LIST_RE); // 画面遷移せず一覧に留まる
      });

      test("E2E-M03-15-003 ダウンロードファイル名に日時を含み拡張子が .csv である", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeExportPage(page);
        await p.gotoList();
        const download = await p.exportViaLink();
        // 設計書(処理フロー)は「ファイル名は日時を含む」。接頭辞の実装値はオラクル化しない。
        expect(download.suggestedFilename()).toMatch(FILENAME_HAS_DATETIME);
      });

      test("E2E-M03-15-005 ログイン済みでCSV出力URLへ直接GETするとCSVダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeExportPage(page);
        const download = await p.gotoExportForDownload(); // URL直接アクセスでも出力可（CSV出力が可能）
        expect(download).toBeTruthy();
        expect(download.suggestedFilename()).toMatch(FILENAME_HAS_DATETIME);
      });
    });
  }
);
