/**
 * 在庫管理「在庫情報カスタムCSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m04_05_admin_stock_product_stock_custom_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV内容・列/並び/rank順・検索条件一致・件数厳密一致）／
 * 対象外（入力フォーム非保持のためバリデーション非該当、DB内部値、ログ抑止、CSRF=GETダウンロード）は
 * ケース表で全量管理し、specに大量のfixmeを残さない（規約準拠）。要シード/要実機/仕様乖離の自動化予定のみ test.fixme。
 *
 * 期待結果は仕様(functions/pf-eccube3/m04-05_admin_stock_product_stock_custom_csv_export.md / 観点表)由来
 * （オラクル独立性）。実装(messages.ja.yaml・twig)からはセレクタ・ルート（位置情報）のみを取り、
 * 翻訳文言・Content-Type・Content-Disposition 等の実装値は合否オラクルにしない。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 仕様乖離（付帯表4）: 設計書の入口は GET/POST /custom_csv/export/{id}（admin_custom_export）だが、刷新先の在庫一覧
 * プルダウンは GET /product/stock/custom-csv/{id}（admin_stock_list_custom_csv・検索条件必須）を指す。本specは
 * 設計入口(admin_custom_export)を直接ダウンロード/404の確認に用い、プルダウンはUI部品・操作起点の確認に用いる。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockProductStockCustomCsvExportPage } from "../../../pages/admin/m04/m04_05_admin_stock_product_stock_custom_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
const SETTING_CUSTOM_CSV_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv/`);

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "在庫管理 > 在庫情報カスタムCSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M04-05-030 未ログインで在庫一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 未ログイン管理者はアクセス不可（設計「権限・認可」）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-05-031 未ログインでカスタムCSV出力URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 設計入口 /custom_csv/export/{id}。拡張IDは任意（到達前にガード）＝出力されない（設計「エラー処理」）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/custom_csv/export/1`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== UI部品・操作起点（認証要・要検索・非破壊） =====

    test("E2E-M04-05-001 検索後の在庫一覧にプルダウン#stock_csv_pulldownと先頭オプションが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      await p.gotoStockList();
      await p.submitSearch(); // CSVボタン群は検索結果がある場合のみ表示（stock_list_index.twig:439）
      test.skip((await p.csvPulldown.count()) === 0, "検索結果が0件でプルダウン非表示（SEED-M04-05-STOCK）");
      await p.seePulldown(); // #stock_csv_pulldown 表示＋先頭「在庫情報カスタムCSV出力」
    });

    test("E2E-M04-05-002 プルダウン末尾に「出力項目設定」オプションが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      await p.gotoStockList();
      await p.submitSearch();
      test.skip((await p.csvPulldown.count()) === 0, "検索結果が0件でプルダウン非表示（SEED-M04-05-STOCK）");
      // messages.ja.yaml:4456 admin.stock.list.custom_csv_settings
      await expect(p.settingOption()).toHaveCount(1);
    });

    test("E2E-M04-05-003 先頭の空値オプションは選択しても遷移しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      await p.gotoStockList();
      await p.submitSearch();
      test.skip((await p.csvPulldown.count()) === 0, "検索結果が0件でプルダウン非表示（SEED-M04-05-STOCK）");
      const before = page.url();
      // JS(stock_list_index.twig:781): value が空なら遷移しない。
      await p.csvPulldown.selectOption("");
      await expect(page).toHaveURL(before);
    });

    test("E2E-M04-05-012 ダウンロードはプルダウン変更のみで確認ダイアログを表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      await p.gotoStockList();
      await p.submitSearch();
      const values = await p.extensionOptionValues();
      test.skip(values.length === 0, "在庫CSV拡張のシードが無い（SEED-M04-05-STOCK-CSV-EXT）");
      // フロント挙動: ダウンロード前の確認モーダル/ダイアログは無い（設計「モーダル・ポップアップ」）。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const download = await p.selectExtensionAndWaitDownload(values[0]);
      expect(download.suggestedFilename()).toMatch(/\.csv$/); // 設計: CSVファイルがダウンロードされる
      expect(dialogShown, "ダウンロード前の確認ダイアログは表示されない").toBe(false);
    });

    // ===== ダウンロード発火・HTTP応答（認証要・要シード／設計入口を直接利用） =====

    test("E2E-M04-05-010 在庫CSV拡張選択でCSVダウンロードが発火し画面遷移しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      await p.gotoStockList();
      await p.submitSearch();
      const values = await p.extensionOptionValues();
      test.skip(values.length === 0, "在庫CSV拡張のシードが無い（SEED-M04-05-STOCK-CSV-EXT）");
      const urlBefore = page.url();
      const download = await p.selectExtensionAndWaitDownload(values[0]);
      // 設計「画面遷移せずCSVを出力する」「成功時出力＝在庫情報のCSVファイル」。CSVの中身は手動確認（付帯表）。
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
      await expect(page).toHaveURL(urlBefore); // ダウンロードのみで画面遷移を伴わない
    });

    test("E2E-M04-05-011 有効拡張のダウンロード応答がHTTP200で返る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      await p.gotoStockList();
      await p.submitSearch();
      const ids = await p.extensionIds();
      test.skip(ids.length === 0, "在庫CSV拡張のシードが無い（SEED-M04-05-STOCK-CSV-EXT）");
      // 設計入口 admin_custom_export を認証済みコンテキストで直接GET（検索前提なし・設計どおり）。
      // 観点=HTTPステータス。設計「成功時出力＝在庫情報のCSV」。
      // 注: Content-Disposition/Content-Type は設計に規定が無い実装値のためオラクルにしない。
      //     添付ダウンロードの観測は download イベントを使う 010/012 で行う。
      const res = await page.context().request.get(p.designExportUrl(ids[0]));
      expect(res.status()).toBe(200);
    });

    // ===== URL直接アクセス（IT-13）／出力失敗404（IT-27・異常系） =====

    test("E2E-M04-05-020 設計入口URL直接GET（有効拡張）で在庫CSVが出力される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      await p.gotoStockList();
      await p.submitSearch();
      const ids = await p.extensionIds();
      test.skip(ids.length === 0, "在庫CSV拡張のシードが無い（SEED-M04-05-STOCK-CSV-EXT）");
      // 設計「指定したカスタムCSVの出力項目で在庫情報をCSVとして出力する」。IDはプルダウン由来（創作しない）。
      // CSVの中身・列・並びは手動確認（付帯表）。Content-Disposition 等の実装ヘッダはオラクルにしない。
      const res = await page.context().request.get(p.designExportUrl(ids[0]));
      expect(res.status()).toBe(200);
    });

    test("E2E-M04-05-022 設計入口URLへPOSTでも在庫CSVが出力される（GET/POST入口）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      await p.gotoStockList();
      await p.submitSearch();
      const ids = await p.extensionIds();
      test.skip(ids.length === 0, "在庫CSV拡張のシードが無い（SEED-M04-05-STOCK-CSV-EXT）");
      // 設計「利用者視点の入口」は GET/POST /custom_csv/export/{id}。POST 方式でも同じく出力されること。
      const res = await page.context().request.post(p.designExportUrl(ids[0]));
      expect(res.status()).toBe(200);
    });

    test("E2E-M04-05-021 存在しないカスタムCSVのURL直接GET→404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      // 設計「カスタムCSVが存在しない場合はページが見つからない扱い（404）」。
      // 大きな未使用IDを用い、不存在を 404 で確認する（CustomExportCsvController.php:75-77）。
      const res = await page.context().request.get(p.designExportUrl(999999999));
      expect(res.status()).toBe(404);
    });

    test("E2E-M04-05-023 存在しないカスタムCSVのURL直接POST→404（022 POST正常系の異常系の対）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      // 設計「利用者視点の入口」は GET/POST。POST 方式でも不存在は「ページが見つからない扱い（404）」。
      // 設計「エラー処理: カスタムCSVが存在しない→404」。022（POST正常）に対する異常系の対。
      const res = await page.context().request.post(p.designExportUrl(999999999));
      expect(res.status()).toBe(404);
    });

    // ===== 遷移（IT-03 外部画面） =====

    test("E2E-M04-05-013 設定オプション選択でカスタムCSV出力項目設定画面へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StockProductStockCustomCsvExportPage(page);
      await p.gotoStockList();
      await p.submitSearch();
      test.skip((await p.csvPulldown.count()) === 0, "検索結果が0件でプルダウン非表示（SEED-M04-05-STOCK）");
      // オラクル独立性: 選択キーは実装trans文言でなく設計由来ルート(value)を用いる。
      const settingValue = await p.settingOption().getAttribute("value");
      expect(settingValue, "設定オプションは custom_csv 設定URLを持つ").toContain("setting/shop/custom_csv");
      await Promise.all([
        page.waitForURL(SETTING_CUSTOM_CSV_RE),
        p.csvPulldown.selectOption(settingValue as string),
      ]);
      await expect(page).toHaveURL(SETTING_CUSTOM_CSV_RE);
    });

    // ===== 自動化予定だが要実機/仕様乖離（未実装。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M04-05-040 刷新プルダウン経路は検索条件未指定だと出力されず在庫一覧へリダイレクト＋警告（仕様乖離#2・要確認）",
      async () => {
        // 期待は設計に無い前提条件（StockListController.php:273-278 admin.stock.list.search_required_for_csv）。
        // 設計書では検索前提の記載が無いため、刷新仕様の妥当性を要確認としたうえで実機検証する。
      }
    );

    test.fixme(
      "E2E-M04-05-041 削除済み/在庫以外CsvTypeの拡張IDの直接GET→404（要: 専用拡張シード SEED-M04-05-NONSTOCK-EXT）",
      async () => {
        // 期待は仕様(失敗時出力=404)由来。刷新route(StockListController.php:281-284)はCsvType!=STOCKで404。
        // 在庫以外のCSV種別/削除済み拡張を用意し、直接GETで404になることを検証する。
      }
    );
  }
);
