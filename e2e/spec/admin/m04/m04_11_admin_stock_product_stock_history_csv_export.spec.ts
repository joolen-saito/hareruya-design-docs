/**
 * 管理画面 在庫管理「在庫移動・振替情報カスタムCSV出力（在庫履歴CSV出力）」E2E（M04-11）。
 * 納品ケース表 integration_test/e2e/m04_11_admin_stock_product_stock_history_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV本文＝列・値・文字コード・対象データ一致・検索条件反映）・
 * 間接（参照のみ＝業務データ非更新）・対象外（入力フォーム非保持のバリデーション群・ログ抑止・確認ダイアログ・CSRF）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m04-11_admin_stock_product_stock_history_csv_export.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・Form制約・固定ヘッダ列・ファイル名prefixは期待値に流用しない。
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み:
 *   route admin_stock_history_csv_export = POST /<route>/product/stock/history/csv_export（StockHistoryController.php:269）/
 *   起点ボタン「CSVダウンロード」history.twig:598-603（在庫履歴一覧 admin_stock_history）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 設計乖離（付帯表4参照・テストは仕様どおりに書き、実装が違えば落ちて検出）:
 *  - 設計の入口URL/メソッドは GET/POST /<route>/product/history/stock/export、実装は POST /<route>/product/stock/history/csv_export（要確認）。
 *  - 設計は「カスタムCSV（出力項目変更可能）」、実装は固定ヘッダ列（要確認）。
 *  - 対象ID空時のエラー trans キー admin.stock_history.not_select が messages.ja.yaml に未定義（不具合候補）。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。CSV本文検査・検索条件反映・参照のみ非更新はシード/DB依存のためケース表(付帯表3/4)で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockProductStockHistoryCsvExportPage } from "../../../pages/admin/m04/m04_11_admin_stock_product_stock_history_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const HISTORY_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/history(\\?|/|$)`
);
const LOGIN_RE = /\/login(\?|$)/;
// 在庫履歴一覧の画面タイトル（仕様: 在庫履歴の検索/一覧画面が起点）。
const TITLE = "在庫履歴一覧";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 在庫履歴CSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-11-020 未ログインで在庫履歴一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockProductStockHistoryCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE); // 未ログイン管理者はアクセス不可（権限・認可）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M04-11-001 在庫履歴一覧画面（CSV出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new StockProductStockHistoryCsvExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(HISTORY_RE);
        await p.seeListScreen();
        await expect(p.title).toContainText(TITLE);
      });

      test("E2E-M04-11-002 検索結果がある場合に「CSVダウンロード」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new StockProductStockHistoryCsvExportPage(page);
        await p.runSearch();
        // CSV出力フォームは pagination.totalItemCount>0（検索結果あり）の場合のみ描画（history.twig:565）。
        await expect(p.csvExportButton).toBeVisible();
      });

      test("E2E-M04-11-010 「CSVダウンロード」ボタン押下でCSVダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockProductStockHistoryCsvExportPage(page);
        await p.runSearch();
        const download = await p.downloadViaButton();
        expect(download).toBeTruthy(); // 画面遷移せずCSVダウンロードが発火（成功時出力＝CSVファイル）
      });

      test("E2E-M04-11-011 CSV出力が添付ファイル（.csvファイル）として発火する", async ({
        page,
      }) => {
        await login(page);
        const p = new StockProductStockHistoryCsvExportPage(page);
        await p.runSearch();
        // 仕様: 成功時出力＝在庫変更履歴のCSVファイル（添付ダウンロード／画面遷移なし）。
        // 「CSVダウンロード」ボタン押下で発火する download を観測する。
        // ※実装のForm項目名（ids[]）・content-type値・filename prefixは期待値に固定しない（オラクル独立性）。
        //   download イベントの発火自体が添付（attachment）応答であることを示し、
        //   suggestedFilename の .csv 拡張子で「CSVファイル」を判定する（仕様: 入出力 成功時出力）。
        const download = await p.downloadViaButton();
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      });

      test("E2E-M04-11-012 CSV出力は画面遷移せず一覧に滞留しダウンロードのみ行われる", async ({ page }) => {
        await login(page);
        const p = new StockProductStockHistoryCsvExportPage(page);
        await p.runSearch();
        const urlBefore = page.url();
        const download = await p.downloadViaButton();
        expect(download).toBeTruthy();
        await expect(page).toHaveURL(HISTORY_RE); // ダウンロード後も在庫履歴一覧に滞留（画面遷移なし）
        expect(page.url()).toBe(urlBefore);
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-11-003 検索結果ゼロ件のとき「CSVダウンロード」ボタンが表示されない（要: 0件ヒットする検索条件のシード/手順）",
      async () => {
        // 期待は仕様(フロント挙動・CSVダウンロードのみ＝結果なし時は出力導線なし)由来。
        // 0件ヒットを安定生成する在庫履歴検索条件（存在しない商品コード等）を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M04-11-021 未ログインでCSV出力URLへアクセスすると管理ログイン画面へ誘導（要: POST専用ルートの未認証到達手順の実機確認）",
      async () => {
        // 期待は仕様(未ログイン管理者はアクセス不可)由来。実装は admin_stock_history_csv_export が POST専用のため、
        // GETナビゲーションでは405/ログイン誘導いずれかになり得る。未認証到達の観測手順を実機確認後に実装する（付帯表4#1,#4）。
      }
    );

    test.fixme(
      "E2E-M04-11-030 対象ID無しでCSV出力POST→一覧へリダイレクト＋エラーで出力されない（要: 直接POST手順／trans欠落の実機確認）",
      async () => {
        // 期待は仕様(認証・権限以外＝出力対象なしでは出力しない)由来。実装は addError(admin.stock_history.not_select)＋
        // admin_stock_history_page へリダイレクト（StockHistoryController.php:278-280,444-450）。
        // ただし trans キー admin.stock_history.not_select は messages.ja.yaml 未定義（不具合候補）。
        // 通常UIでは ids[] が自動付与されるため、ids無しは直接POSTでのみ到達。手順確定後に実装する。
      }
    );
  }
);
