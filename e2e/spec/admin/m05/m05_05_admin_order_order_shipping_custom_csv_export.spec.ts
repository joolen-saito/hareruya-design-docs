/**
 * 受注管理「カスタム配送CSVダウンロード」E2E（配送カスタムCSV出力）。
 * 納品ケース表 integration_test/e2e/m05_05_admin_order_order_shipping_custom_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV内容＝ヘッダ/配送ごと行分割/受注→配送フォールバック/
 * 検索条件一致/0件ヘッダのみ/BOM・エンコーディング）／対象外（設定フォーム保存・列定義＝別機能 m10-13 へ委譲、
 * DB内部値 dtb_csv.enabled/sort_no、ログ抑止、セッション非更新、CSRF）はケース表で全量管理し、
 * spec に大量の fixme を残さない（規約準拠）。前提（シード/資格情報/0件環境）が無いケースは
 * test.skip で前提欠落を可視化し、test.fixme は残さない。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-05_admin_order_order_shipping_custom_csv_export.md /
 * CustomExportCsvController.php / messages.ja.yaml)由来（オラクル独立性）。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * 前提（重要）: CSV操作UI（カスタム配送CSVダウンロードのドロップダウン）は受注一覧テンプレートで
 * {% if pagination and pagination.totalItemCount %} 配下に描画される（Order/index.twig:1094-1367）。
 * したがって受注一覧の検索結果が0件の環境ではドロップダウン自体が描画されず、UI/遷移系
 * （001/002/003/010-013/020/050）は設計と無関係に失敗する。これらは受注≥1件のシード
 * （SEED-M05-05-ADMIN / SEED-M05-05-NOEXT）を前提とする。下記 ensureCsvUiPresent で前提欠落を
 * skip として可視化し、誤検知（受注0件起因）を仕様不具合と取り違えない。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderShippingCustomCsvExportPage } from "../../../pages/admin/m05/m05_05_admin_order_order_shipping_custom_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
const ORDER_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order`);
// 設定画面: csvTypeId=4（CSV_TYPE_SHIPPING）。仕様「配送カスタムCSV設定画面へGET遷移」。
const SETTING_CUSTOM_CSV_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv/4`);
// 仕様: ファイル名 shipping_{YmdHis}.csv（CustomExportCsvController.php:102）。
const FILENAME_RE = /^shipping_\d{14}\.csv$/;
// 到達しない大きな csvExtensionId（404 期待）。
const NONEXISTENT_ID = 999999999;

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

/**
 * CSV操作UIの描画前提を満たすか確認する。受注一覧は totalItemCount>0 のときだけ
 * CSV操作UI（カスタム配送CSVドロップダウン）を描画する（Order/index.twig:1094-1367）。
 * 受注0件はシード前提欠落であり仕様不具合ではないため skip で可視化する。
 */
async function ensureCsvUiPresent(p: OrderOrderShippingCustomCsvExportPage) {
  const present = await p.isCsvUiPresent();
  test.skip(!present, "受注一覧の検索結果が0件でCSV操作UIが未描画（要: 受注≥1件のシード）");
}

test.describe(
  "受注管理 > 配送カスタムCSV出力",
  { tag: ["@admin", "@order", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M05-05-040 未ログインでダウンロードURL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 未認証は管理画面共通制約でログインへ。拡張IDは任意（到達前にガード）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/custom_csv/export/1`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-05-041 未ログインで受注一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== UI部品・遷移（認証要・非破壊） =====

    test("E2E-M05-05-001 受注一覧に「カスタム配送CSVダウンロード」ドロップダウンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.seeDropdownButton(); // #customShippingCsvDownloadDropDown
    });

    test("E2E-M05-05-002 ドロップダウンを開くと「出力項目設定」リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      // 設計: 登録フォーマットが無くても設定画面への導線は残る。href=setting/shop/custom_csv で識別。
      await expect(p.settingLink).toHaveCount(1);
    });

    test("E2E-M05-05-020 「出力項目設定」クリックで配送カスタムCSV設定画面へGET遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      await p.settingLink.click();
      await expect(page).toHaveURL(SETTING_CUSTOM_CSV_RE); // 設定画面（csvTypeId=4）へGET
    });

    test("E2E-M05-05-003 ドロップダウンに登録済みフォーマット名リンクが表示される（要シード）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      const hrefs = await p.formatLinkHrefs();
      test.skip(hrefs.length === 0, "配送CSV拡張のシードが無い（SEED-M05-05-SHIPPING-CSV-EXT）");
      // フォーマット名リンクは admin_custom_export（custom_csv/export/{id}）へのGETリンクである。
      expect(hrefs.every((h) => h.includes("custom_csv/export"))).toBe(true);
    });

    // ===== 異常系（認証要・非破壊） =====

    test("E2E-M05-05-030 存在しないcsvExtensionIdで404になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      // 仕様/実装: 拡張行が無ければアクセス拒否（HTTP404相当）。CustomExportCsvController.php:75-77。
      const resp = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/custom_csv/export/${NONEXISTENT_ID}`);
      expect(resp?.status()).toBe(404);
    });

    // ===== ダウンロード発火・ファイル名・応答ヘッダ（認証要・要シード） =====

    test("E2E-M05-05-010 フォーマット名リンク押下でCSVダウンロードが発火する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      const hrefs = await p.formatLinkHrefs();
      test.skip(hrefs.length === 0, "配送CSV拡張のシードが無い（SEED-M05-05-SHIPPING-CSV-EXT）");
      const download = await p.clickFormatLinkAndWaitDownload(0);
      expect(download).toBeTruthy(); // ダウンロードが発火すること
    });

    test("E2E-M05-05-011 ダウンロードファイル名が shipping_{YmdHis}.csv である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      const hrefs = await p.formatLinkHrefs();
      test.skip(hrefs.length === 0, "配送CSV拡張のシードが無い（SEED-M05-05-SHIPPING-CSV-EXT）");
      const download = await p.clickFormatLinkAndWaitDownload(0);
      // 仕様: 接頭辞 shipping_ ＋日時(YmdHis) ＋ .csv。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    test("E2E-M05-05-012 ダウンロード応答が添付CSV（Content-Type/Content-Disposition）である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      const hrefs = await p.formatLinkHrefs();
      test.skip(hrefs.length === 0, "配送CSV拡張のシードが無い（SEED-M05-05-SHIPPING-CSV-EXT）");
      // 認証済みコンテキストの request で直接 GET し、応答ヘッダを確認する（仕様 :103-104）。
      const resp = await page.request.get(hrefs[0]);
      expect(resp.status()).toBe(200);
      expect(resp.headers()["content-type"]).toContain("application/octet-stream");
      expect(resp.headers()["content-disposition"]).toContain("attachment");
      expect(resp.headers()["content-disposition"]).toContain("shipping_");
    });

    test("E2E-M05-05-013 ダウンロード後も受注一覧ページに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      const hrefs = await p.formatLinkHrefs();
      test.skip(hrefs.length === 0, "配送CSV拡張のシードが無い（SEED-M05-05-SHIPPING-CSV-EXT）");
      await p.clickFormatLinkAndWaitDownload(0);
      // 設計「画面遷移」: 同一タブでダウンロードが始まり受注一覧はそのまま残る。
      await expect(page).toHaveURL(ORDER_LIST_RE);
    });

    test("E2E-M05-05-014 POST直接アクセスでもGETと同一のCSVがダウンロードされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      const hrefs = await p.formatLinkHrefs();
      test.skip(hrefs.length === 0, "配送CSV拡張のシードが無い（SEED-M05-05-SHIPPING-CSV-EXT）");
      // 設計「入出力」: ルートは GET,POST 両対応で同一処理。本文有無は成否に影響しない。
      const resp = await page.request.post(hrefs[0]);
      expect(resp.status()).toBe(200);
      expect(resp.headers()["content-type"]).toContain("application/octet-stream");
      expect(resp.headers()["content-disposition"]).toContain("attachment");
      expect(resp.headers()["content-disposition"]).toContain("shipping_");
    });

    test("E2E-M05-05-015 フォーマット名押下時に確認ダイアログ/モーダルが出ず直接ダウンロードされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      const hrefs = await p.formatLinkHrefs();
      test.skip(hrefs.length === 0, "配送CSV拡張のシードが無い（SEED-M05-05-SHIPPING-CSV-EXT）");
      // 設計「フロント挙動」: 出力前確認ダイアログ・非同期取得・モーダルはない。
      let dialogSeen = false;
      page.on("dialog", (d) => {
        dialogSeen = true;
        void d.dismiss();
      });
      const download = await p.clickFormatLinkAndWaitDownload(0);
      expect(download).toBeTruthy(); // 確認なしでそのままDL発火
      expect(dialogSeen).toBe(false); // 出力前確認ダイアログが出ないこと
    });

    // ===== 登録0件（条件付き実行・前提欠落はskipで可視化。手動/対象外はケース表で全量管理） =====

    test("E2E-M05-05-050 登録フォーマット0件時はフォーマットリンクが無く設定導線のみ", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OrderOrderShippingCustomCsvExportPage(page);
      await p.gotoOrderList();
      await ensureCsvUiPresent(p); // 受注0件はシード前提欠落として skip（仕様不具合と区別）
      await p.openDropdown();
      const hrefs = await p.formatLinkHrefs();
      // 0件状態を作れない環境（配送CSV拡張が既に存在）は前提欠落として skip（誤検知防止）。
      // 期待は仕様（利用者視点の入口「登録フォーマットが1件も無い」→設定画面への導線のみ）由来。
      test.skip(hrefs.length > 0, "配送CSV拡張が0件でない環境（要: SEED-M05-05-NOEXT の隔離）");
      await expect(p.formatLinks).toHaveCount(0); // フォーマット名リンクは無い
      await expect(p.settingLink).toHaveCount(1); // 出力項目設定の導線のみ残る
    });
  }
);
