/**
 * 商品管理「カスタムデータ CSV ダウンロード（商品情報）」E2E。
 * 納品ケース表 integration_test/e2e/m03_06_admin_product_product_custom_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV内容・検索条件一致・0件ヘッダのみ）／対象外
 * （設定フォーム保存/削除/バリデーション＝別機能 m10-13 へ委譲、DB内部値、ログ抑止）はケース表で全量管理し、
 * specに大量のfixmeを残さない（規約準拠）。要シード/要実機の自動化予定のみ test.fixme で残す。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-06_admin_product_product_custom_csv_export.md /
 * ProductCsvController.php / ProductAllCsv.php / messages.ja.yaml)由来（オラクル独立性）。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductCustomCsvExportPage } from "../../../pages/admin/m03/m03_06_admin_product_product_custom_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
const SETTING_CUSTOM_CSV_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv/`);
// 仕様: ファイル名 product_custom{YmdHis}.csv（ProductAllCsv.php:736,2063）。
const FILENAME_RE = /^product_custom\d{14}\.csv$/;

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "商品管理 > カスタムデータCSVダウンロード",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M03-06-030 未ログインでダウンロードURL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 未認証は管理画面共通制約でログインへ。拡張IDは任意（到達前にガード）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product_all_csv_custom_export/1`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-06-031 未ログインで商品一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== UI部品（認証要・非破壊） =====

    test("E2E-M03-06-001 商品一覧にプルダウン#csv_pulldownと先頭オプションが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductCustomCsvExportPage(page);
      await p.gotoProductList();
      await p.seePulldown(); // #csv_pulldown 表示＋先頭「カスタムデータCSVダウンロード」
    });

    test("E2E-M03-06-002 プルダウン末尾に「カスタムCSV出力項目設定」オプションが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductCustomCsvExportPage(page);
      await p.gotoProductList();
      // messages.ja.yaml:3901 admin.setting.shop.custom_csv_setting
      await expect(p.settingOption()).toHaveCount(1);
    });

    test("E2E-M03-06-003 先頭の空値オプションは選択しても遷移しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductCustomCsvExportPage(page);
      await p.gotoProductList();
      const before = page.url();
      // JS(index.twig:118-123): value が空なら window.location.href へ遷移しない。
      await p.csvPulldown.selectOption("");
      await expect(page).toHaveURL(before);
    });

    test("E2E-M03-06-012 ダウンロードはプルダウン変更のみで確認ダイアログを表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductCustomCsvExportPage(page);
      await p.gotoProductList();
      // フロント挙動: ダウンロード前の確認モーダル/ダイアログは無い（設計「モーダル・ポップアップ」）。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const values = await p.extensionOptionValues();
      test.skip(values.length === 0, "商品CSV拡張のシードが無い（SEED-M03-06-PRODUCT-CSV-EXT）");
      // 拡張選択でダウンロードが発火し、確認ダイアログは介在しない。
      const download = await p.selectExtensionAndWaitDownload(values[0]);
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      expect(dialogShown, "ダウンロード前の確認ダイアログは表示されない").toBe(false);
    });

    // ===== ダウンロード発火・ファイル名（認証要・要シード） =====

    test("E2E-M03-06-010 拡張選択でCSVダウンロードが発火しファイル名がproduct_custom{YmdHis}.csv", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductCustomCsvExportPage(page);
      await p.gotoProductList();
      const values = await p.extensionOptionValues();
      test.skip(values.length === 0, "商品CSV拡張のシードが無い（SEED-M03-06-PRODUCT-CSV-EXT）");
      const download = await p.selectExtensionAndWaitDownload(values[0]);
      // 仕様: filename="product_custom{YmdHis}.csv"。CSVの中身は手動確認（ケース表 付帯表）。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    test("E2E-M03-06-011 有効拡張のダウンロード応答がtext/csvでattachment配信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductCustomCsvExportPage(page);
      await p.gotoProductList();
      const values = await p.extensionOptionValues();
      test.skip(values.length === 0, "商品CSV拡張のシードが無い（SEED-M03-06-PRODUCT-CSV-EXT）");
      // 認証済みコンテキストのリクエストでヘッダを観測（ブラウザのダウンロード保存を介さない）。
      const res = await page.context().request.get(values[0]);
      expect(res.status()).toBe(200);
      // 仕様: Content-Type text/csv（ProductAllCsv.php:822）, Content-Disposition attachment product_custom（同:823）。
      expect(res.headers()["content-type"] || "").toContain("text/csv");
      expect(res.headers()["content-disposition"] || "").toContain("product_custom");
    });

    test("E2E-M03-06-020 ダウンロードURL直接GET（有効拡張）でCSVが添付配信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductCustomCsvExportPage(page);
      await p.gotoProductList();
      // 一覧プルダウンから有効な拡張URLを取得して直接GETする（IDを創作しない）。
      const values = await p.extensionOptionValues();
      test.skip(values.length === 0, "商品CSV拡張のシードが無い（SEED-M03-06-PRODUCT-CSV-EXT）");
      const res = await page.context().request.get(values[0]);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-disposition"] || "").toMatch(/attachment/);
    });

    // ===== 404（認証要・資格情報のみで実行可） =====

    test("E2E-M03-06-021 存在しない拡張IDのダウンロードURL直接GET→404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductCustomCsvExportPage(page);
      // 仕様: 不正・削除済み拡張、または商品以外/列名皆無は HTTP 404（ProductCsvController.php:216,228）。
      // 大きな未使用IDを用い、不存在を 404 で確認する。
      const res = await page.context().request.get(p.downloadUrl(999999999));
      expect(res.status()).toBe(404);
    });

    // ===== 遷移（認証要） =====

    test("E2E-M03-06-013 設定オプション選択でカスタムCSV設定画面(GET)へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new ProductProductCustomCsvExportPage(page);
      await p.gotoProductList();
      // 設定オプションの value(URL) を取得し、JSと同じく当該URLへ遷移することを確認する。
      // オラクル独立性: 選択キーは実装trans文言でなく設計由来ルート(value)を用いる。
      const settingValue = await p.settingOption().getAttribute("value");
      expect(settingValue, "設定オプションは custom_csv 設定URLを持つ").toContain("setting/shop/custom_csv");
      await Promise.all([
        page.waitForURL(SETTING_CUSTOM_CSV_RE),
        p.csvPulldown.selectOption(settingValue as string),
      ]);
      await expect(page).toHaveURL(SETTING_CUSTOM_CSV_RE);
    });

    // ===== 自動化予定だが要シード/要実機（未実装。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M03-06-040 削除済み(deleted_at)拡張IDの直接GET→404（要: 論理削除済み拡張シード SEED-M03-06-DELETED-EXT）",
      async () => {
        // 期待は仕様(ProductCsvController.php:214-216 deleted_at/csv_type判定)由来。
        // 論理削除済みの商品CSV拡張IDを用意し、直接GETで 404 になることを検証する。
      }
    );

    test.fixme(
      "E2E-M03-06-041 列名(column_name)が全て空の拡張IDの直接GET→404（要: 列名皆無の拡張シード SEED-M03-06-EMPTYCOL-EXT）",
      async () => {
        // 期待は仕様(ProductCsvController.php:220-228 columnNames=[] で404)由来。
        // 出力項目の column_name が全て空の拡張を用意し、直接GETで 404 になることを検証する。
      }
    );

    test.fixme(
      "E2E-M03-06-042 CSV種別が商品以外の拡張IDの直接GET→404（要: 商品以外CSV種別の拡張シード SEED-M03-06-NONPRODUCT-EXT）",
      async () => {
        // 期待は仕様(処理フロー#2 / ProductCsvController.php:215-216 getCsvType()!=CSV_TYPE_PRODUCT で404)由来。
        // 未削除だが CSV種別が商品以外の拡張を用意し、直接GETで 404 になることを検証する。
      }
    );
  }
);
