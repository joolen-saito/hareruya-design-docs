/**
 * 管理画面 会員管理「顧客情報CSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m08_03_admin_customer_customer_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、ドロップダウンJS依存など要実機確認のものは test.fixme（理由付き）で残す。
 * 手動・対象外（CSV内容・検索条件反映・項目設定反映・ログ抑止・ストリーミング内部）はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m08-03_admin_customer_customer_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(methods/必須)は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: 資格情報を要するケースのみ各 test 冒頭で test.skip(!HAS_CREDS)（describe全体には掛けない。
 * さもないと未認証ガード 020 まで止まる。reference: spec/admin/two_factor_auth.spec.ts）。資格情報はコミットしない。
 * CSVの中身・拡張項目(point/identity_confirm_status_id/smaregi_id)・郵便番号 postal_code 単一列・検索条件反映は
 * ケース表 101-105（手動/対象外）で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerCsvExportPage } from "../../../pages/admin/m08/m08_03_admin_customer_customer_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 成功時出力は設計書「会員情報のCSVファイル」由来＝拡張子 .csv のみをオラクルにする。
// 接頭辞 customer_ ＋14桁日時(.csv) は実装(CustomerController.php:343)由来のため期待値に固定しない（オラクル独立性）。
const CSV_FILENAME_RE = /\.csv$/i;
// 会員一覧URL（admin_customer = /<route>/customer。ページングあり）。
const CUSTOMER_LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/customer(/page/\\d+)?(\\?|$)`
);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 会員管理 > 顧客情報CSV出力",
  { tag: ["@admin", "@customer", "@csv"] },
  () => {
    // 規約: describe全体に skip を掛けると未認証ガード(020)まで止まるため、describe-level skip は置かない。
    // 資格情報を要するケースのみ各 test 冒頭で test.skip(!HAS_CREDS) する（reference: two_factor_auth.spec.ts）。

    // ===== 操作起点UI・URL（会員一覧） =====

    test("E2E-M08-03-002 「CSVダウンロード」リンクが会員CSV出力URLを指す", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面ログインE2Eをスキップ");
      await login(page);
      const p = new CustomerCustomerCsvExportPage(page);
      await p.gotoList();
      // リンクはドロップダウン内だが DOM 上に存在する。href（出力URL）を位置情報として確認する。
      await expect(p.csvExportLink).toHaveAttribute("href", /\/customer\/export$/);
    });

    test("E2E-M08-03-014 CSV出力は確認ダイアログ/モーダルを介さない（直接リンク）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面ログインE2Eをスキップ");
      await login(page);
      const p = new CustomerCustomerCsvExportPage(page);
      await p.gotoList();
      // 仕様(フロント挙動「本機能専用のモーダルは無い」): 出力起点は出力URLへの a タグで、モーダルを開く属性を持たない。
      await expect(p.csvExportLink).toHaveAttribute("href", /\/customer\/export$/);
      await expect(p.csvExportLink).not.toHaveAttribute("data-toggle", "modal");
      await expect(p.csvExportLink).not.toHaveAttribute("data-bs-toggle", "modal");
    });

    test("E2E-M08-03-021 ログイン済み管理者は会員CSV出力の操作起点を利用できる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面ログインE2Eをスキップ");
      await login(page);
      const p = new CustomerCustomerCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(CUSTOMER_LIST_RE);
      // 権限・認可: ログイン済み管理者には出力リンクが提供される（DOM 存在）。
      await expect(p.csvExportLink).toHaveCount(1);
    });

    // ===== ダウンロード発火・ファイル名・画面遷移なし（直接GET：ドロップダウンJSに依存せず安定） =====

    test("E2E-M08-03-011 会員CSV出力URLへのGETがHTTP200の添付応答でCSVファイルを返す", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面ログインE2Eをスキップ");
      await login(page);
      const p = new CustomerCustomerCsvExportPage(page);
      await p.gotoList(); // セッションに会員検索コンテキストを確立
      const { download, response } = await p.exportViaDirectGetCapturing();
      // HTTPステータス(IT-25): 成功応答（設計書「成功時出力＝会員情報のCSVファイル」）。
      expect(response.status()).toBe(200);
      // 拡張子 .csv のみ仕様(CSVファイル)由来で確認。ファイル名接頭辞・日時は実装由来のため固定しない。
      expect(download.suggestedFilename()).toMatch(CSV_FILENAME_RE);
    });

    test("E2E-M08-03-013 ログイン済みで会員CSV出力URLへ直接GETするとダウンロードが発火する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面ログインE2Eをスキップ");
      await login(page);
      const p = new CustomerCustomerCsvExportPage(page);
      await p.gotoList();
      const dl = await p.exportViaDirectGetAndWaitDownload();
      // ダウンロードが発火し、CSVファイルが得られること（中身は手動101-104）。
      expect(dl.suggestedFilename()).toMatch(CSV_FILENAME_RE);
    });

    test("E2E-M08-03-012 CSV出力は画面遷移せずファイルを出力する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面ログインE2Eをスキップ");
      await login(page);
      const p = new CustomerCustomerCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(CUSTOMER_LIST_RE);
      // 添付応答はナビゲーションを確定させないため、ページは会員一覧に留まる（画面遷移しない）。
      await p.exportViaDirectGetAndWaitDownload();
      await expect(page).toHaveURL(CUSTOMER_LIST_RE);
      expect(page.url()).not.toContain("/customer/export");
    });

    // ===== 未認証ガード =====

    test("E2E-M08-03-020 未ログインで会員CSV出力URLへアクセスすると管理ログイン画面へ誘導され出力しない", async ({
      page,
    }) => {
      // 未認証ガード。資格情報を使わず、未ログイン状態で出力URLへアクセスする。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/export`);
      // 権限・認可(未ログインはアクセス不可)・エラー処理(出力しない): 管理ログイン画面へ誘導される。
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 保留（ドロップダウンJS挙動が要実機確認・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M08-03-001 会員一覧の「CSVダウンロード」ドロップダウンを開くと出力リンクが表示される（要: Bootstrap dropdown 開閉JSの実機確認 data-toggle/data-bs-toggle）",
      async () => {
        // 期待は仕様(利用者視点の入口・フロント挙動)由来。
        // 実装時: await p.openCsvDropdown(); await expect(p.csvExportLink).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M08-03-010 会員一覧のドロップダウン経由で「CSVダウンロード」を押すとダウンロードが発火する（要: dropdown 開閉JSの実機確認）",
      async () => {
        // 期待は仕様(処理フロー#3-6・成功時出力=CSVファイル)由来。安定経路は013(直接GET)でカバー済。
        // 実装時: const dl = await p.exportViaListAndWaitDownload(); expect(dl.suggestedFilename()).toMatch(CSV_FILENAME_RE);
        void CSV_FILENAME_RE;
      }
    );

    test.fixme(
      "E2E-M08-03-015 会員CSV出力URLへ POST した場合のふるまい（要実機確認: 設計書入口は GET/POST 併記だが実装は methods=['GET']。POST=405 見込み・期待値は仕様の入口記述由来）",
      async () => {
        // 設計書「利用者視点の入口」は GET /customer/export または POST。実装(CustomerController.php:281)は GET のみ。
        // テストは仕様(入口=GET/POST許容)で書き、実装が POST 非対応なら落として検出する（実装へ寄せない）。
        // 期待: POST でもダウンロードが発火する／または 405。可否は要実機確認のため fixme で保留。
      }
    );
  }
);
