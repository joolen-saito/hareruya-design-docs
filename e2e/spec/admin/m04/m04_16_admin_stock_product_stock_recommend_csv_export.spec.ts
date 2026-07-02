/**
 * 管理画面 在庫リコメンドCSV出力（M04-16）E2E。
 * 納品ケース表 integration_test/e2e/m04_16_admin_stock_product_stock_recommend_csv_export_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、008(応答ヘッダ観測)は test.fixme。
 * 手動/対象外はケース表で全量管理し、specには大量のfixmeを残さない。
 *
 * 期待結果は仕様(設計md / 観点表 / 基本設計)由来（オラクル独立性）。実装の現挙動・Twig文言・ファイル名を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 仕様乖離(不具合候補#1): 設計mdは本機能をコンソールバッチ(画面なし)と定めるが、刷新先は在庫一覧画面からの
 * ブラウザCSVダウンロードとして実装。E2Eは「CSV出力できること／失敗時は出力されないこと」を刷新先挙動上で観測する。
 *
 * 実行ガード: 管理資格情報(ECCUBE_ADMIN_USER/PASS)が無い場合は test.skip。
 * 検索結果が出る在庫データ(SEED-M04-16-STOCK)前提のケースは、結果0件だと出力リンクが出ないため要シード。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockProductStockRecommendCsvExportPage } from "../../../pages/admin/m04/m04_16_admin_stock_product_stock_recommend_csv_export.page";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 > 在庫管理 > 在庫リコメンドCSV出力",
  { tag: ["@admin", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M04-16-006 未ログインでCSV出力URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      const target = new StockProductStockRecommendCsvExportPage(page);
      await target.gotoRecommendCsvDirect();
      // 仕様: ブラウザ権限制御の入口。未認証は保護され、ログイン画面（ID入力欄）へ誘導される。
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 管理者ログイン必須 =====

    test("E2E-M04-16-003 検索未実行の初期表示ではCSV出力リンクが表示されない（出力抑止）", async ({ page }) => {
      test.skip(!HAS_CREDS, "管理資格情報(ECCUBE_ADMIN_USER/PASS)未設定");
      await login(page);
      const target = new StockProductStockRecommendCsvExportPage(page);
      await target.goto();
      await target.seeRecommendCsvLinkAbsent();
    });

    test("E2E-M04-16-004 検索条件未指定でCSV出力URL直接アクセス→エラーメッセージ表示", async ({ page }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      await login(page);
      const target = new StockProductStockRecommendCsvExportPage(page);
      // 検索を実行せずに直接アクセス（検索セッション無し）
      await target.gotoRecommendCsvDirect();
      await target.seeError(); // 仕様: 失敗時はエラー表示＋処理未完了
    });

    test("E2E-M04-16-005 検索条件未指定でCSV出力URL直接アクセス→在庫一覧へ戻りDLされない", async ({ page }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      await login(page);
      const target = new StockProductStockRecommendCsvExportPage(page);
      // ダウンロードが発生しないことを確認するため download イベントを監視
      let downloadStarted = false;
      page.on("download", () => {
        downloadStarted = true;
      });
      await target.gotoRecommendCsvDirect();
      await target.seeOnStockList(); // 在庫一覧へリダイレクト
      expect(downloadStarted, "ダウンロードが発生しないこと").toBe(false);
    });

    test("E2E-M04-16-001 検索実行後に在庫リコメンドCSV出力リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      // 検索結果0件だとリンクが出ないため SEED-M04-16-STOCK 前提。
      await login(page);
      const target = new StockProductStockRecommendCsvExportPage(page);
      await target.goto();
      await target.search();
      await target.seeRecommendCsvLink();
    });

    test("E2E-M04-16-002 リンク押下でCSV(.csv)ダウンロードが発火する", async ({ page }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      await login(page);
      const target = new StockProductStockRecommendCsvExportPage(page);
      await target.goto();
      await target.search();
      await target.seeRecommendCsvLink();
      const download = await target.downloadViaLink();
      // 仕様: CSVが出力されること。拡張子 .csv を観測（ファイル名の接頭辞は実装依存のため判定に用いない）。
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });

    test("E2E-M04-16-007 検索済みならCSV出力URL直接アクセスでもDLが発火する", async ({ page }) => {
      test.skip(!HAS_CREDS, "管理資格情報未設定");
      await login(page);
      const target = new StockProductStockRecommendCsvExportPage(page);
      // 先に検索して検索条件をセッションに保持させる
      await target.goto();
      await target.search();
      await target.seeRecommendCsvLink();
      // URL直接アクセスでダウンロード発火（リンク経由と同じ待機方針を helper 化）
      const download = await target.downloadViaDirectUrl();
      // 仕様: CSVが出力されること。拡張子 .csv（=仕様のCSV出力形式）を観測。ファイル名接頭辞は実装依存のため判定に用いない。
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });

    // ===== 自動化予定だが未実装/要実機確認（fixme・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M04-16-008 CSV出力応答がブラウザでファイルダウンロード(添付)として扱われる（要: 応答ヘッダ観測の実機確認）",
      async () => {
        // 期待は仕様(API/バッチ結果＝CSV出力)由来＝「添付ダウンロードとして扱われること」。
        // 具体的な応答ヘッダ名・値・ファイル名は実装依存のため期待値に固定しない（オラクル独立性）。
        // 実装の所在(位置情報のみ): StockRecommendCsvExportService.php:94-96。観測手順は実機確認後に実装する。
      }
    );
  }
);
