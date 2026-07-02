/**
 * 管理画面 在庫管理「在庫履歴CSV出力」E2E（M04-18）。
 * 納品ケース表 integration_test/e2e/m04_18_admin_stock_stock_history_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV本文＝列・値・文字コード・BOM・対象データ一致・検索条件反映・
 * 全件出力）・間接（参照のみ＝業務データ非更新）・対象外（入力フォーム非保持のバリデーション群・ログ抑止・確認ダイアログ・
 * CSRF・出力中例外）はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m04-18_admin_stock_stock_history_csv_export.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・固定ヘッダ列・ファイル名prefix(stock_history_)は期待値に流用しない。
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み（screenExists=true）:
 *   route admin_stock_history_csv_export = POST /<route>/product/stock/history/csv_export（StockHistoryController.php:269）/
 *   起点ボタン「CSVダウンロード」history.twig:598-603（在庫履歴一覧 admin_stock_history）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 設計乖離（付帯表4参照・テストは仕様どおりに書き、実装が違えば落ちて検出）:
 *  - 設計の入口URL/メソッドは GET /<route>/product/history/stock/export、実装は POST /<route>/product/stock/history/csv_export（#1）。
 *  - 設計はセッション検索条件で再検索、実装は一覧の全件IDをPOST（#2）。
 *  - ファイル名prefix 設計 product_stock_history_ ／実装 stock_history_（#3）。
 *  - 該当0件 設計はヘッダ行のみCSV、実装は0件時に出力導線が描画されない（#4）。
 *  - 対象ID空時のエラー trans キー admin.stock_history.not_select が messages.ja.yaml に未定義（#5）。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。CSV本文検査・検索条件反映・参照のみ非更新はシード/DB依存のためケース表(付帯表3/4)で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockHistoryCsvExportPage } from "../../../pages/admin/m04/m04_18_admin_stock_stock_history_csv_export.page";
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
// 在庫履歴一覧の画面タイトル（仕様: 在庫履歴の一覧画面が起点）。
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

    test("E2E-M04-18-020 未ログインで在庫履歴一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockHistoryCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE); // 未ログイン管理者はアクセス不可（権限・認可）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M04-18-001 在庫履歴一覧画面（CSV出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockHistoryCsvExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(HISTORY_RE);
        await p.seeListScreen();
        await expect(p.title).toContainText(TITLE);
      });

      test("E2E-M04-18-002 検索結果がある場合に「CSVダウンロード」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockHistoryCsvExportPage(page);
        await p.runSearch();
        // CSV出力フォームは pagination.totalItemCount>0（検索結果あり）の場合のみ描画（history.twig:565）。
        // csvExportButton は formaction=csv_export 限定セレクタ（history.twig:597-600）。has_search_disposal==true（欠品検索）時は
        // formaction が disposal_csv_export に切替わるため、runSearch は欠品フィルタ無しの既定検索で disposal 状態を初期化する（要確認）。
        await expect(p.csvExportButton).toBeVisible();
      });

      test("E2E-M04-18-010 「CSVダウンロード」押下でCSVのダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockHistoryCsvExportPage(page);
        await p.runSearch();
        const download = await p.downloadViaButton();
        expect(download).toBeTruthy(); // 画面遷移せずCSVダウンロードが発火（成功時出力＝CSVファイル）
      });

      test("E2E-M04-18-011 CSV出力が添付ファイル（.csvファイル）として発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockHistoryCsvExportPage(page);
        await p.runSearch();
        // 仕様: 成功時出力＝在庫変更履歴のCSVファイル（添付ダウンロード／画面遷移なし）。
        // ※実装のForm項目名（ids[]）・content-type値・filename prefixは期待値に固定しない（オラクル独立性）。
        //   download イベント発火自体が添付応答であることを示し、suggestedFilename の .csv 拡張子で「CSVファイル」を判定する。
        //   filename prefix（product_stock_history_）の検証は E2E-M04-18-013(fixme・設計乖離#3) で扱う。
        const download = await p.downloadViaButton();
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      });

      test("E2E-M04-18-012 CSV出力は画面遷移せず一覧に滞留しダウンロードのみ行われる", async ({ page }) => {
        await login(page);
        const p = new StockStockHistoryCsvExportPage(page);
        await p.runSearch();
        const urlBefore = page.url();
        const download = await p.downloadViaButton();
        expect(download).toBeTruthy();
        await expect(page).toHaveURL(HISTORY_RE); // ダウンロード後も在庫履歴一覧に滞留（画面遷移なし＝ストリーム応答）
        expect(page.url()).toBe(urlBefore);
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-18-003 該当0件のときヘッダ行のみのCSVが出力される（要: 0件ヒット条件のシード/手順＋設計乖離#4の検出）",
      async () => {
        // 期待は仕様(エッジケース／エラー処理: 該当0件＝ヘッダ行のみCSVを正常出力)由来。
        // 実装は0件時にCSV出力導線(#form_bulk/CSVボタン)が描画されず(history.twig:565)、
        // ids空POSTは addError＋一覧へリダイレクト(StockHistoryController.php:274-277,444-450)＝ヘッダ行のみCSVを出力しない見込み（乖離#4）。
        // 0件ヒットを安定生成する検索条件（存在しない商品コード等）を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M04-18-013 ダウンロードCSVのファイル名が product_stock_history_<時刻>.csv である（設計乖離#3の検出）",
      async () => {
        // 期待は仕様(業務ルール・計算: ファイル名「product_stock_history_」+出力時刻+「.csv」)由来。
        // 実装は createFileName('stock_history_')(src/Eccube/Service/Csv/StockHistoryCsv.php:75)＝prefix stock_history_ で乖離（#3）。
        // download.suggestedFilename() の prefix を product_stock_history_ で判定し、実装が違えば落ちて検出する。
      }
    );

    test.fixme(
      "E2E-M04-18-021 未ログインでCSV出力URLへアクセスするとアクセス不可（要: POST専用ルートの未認証到達手順の実機確認）",
      async () => {
        // 期待は仕様(未ログイン管理者はアクセス不可)由来。実装は admin_stock_history_csv_export が POST専用のため、
        // GETナビゲーションでは405/ログイン誘導いずれかになり得る。未認証到達の観測手順を実機確認後に実装する（付帯表4#1）。
      }
    );

    test.fixme(
      "E2E-M04-18-030 出力対象なしのCSV出力（正典対応なし＝実装固有の防御挙動・要確認）",
      async () => {
        // 注意（オラクル独立性）: 設計(pf-eccube3)に「出力対象なし」の独立した扱いは無い。
        //   設計の該当0件はヘッダ行のみCSVを出力する仕様（=003と同義。正本md:146,230）。
        // 実装は一覧の全件IDを hidden ids[] でPOSTする方式（history.twig:604-606）のため、ID無し直接POST時に
        //   addError(admin.stock_history.not_select)＋admin_stock_history_page リダイレクト
        //   （StockHistoryController.php:274-277,444-450）という実装固有の防御挙動を持つが、これは正典に対応が無い
        //   （trans キー admin.stock_history.not_select も messages.ja.yaml 未定義＝不具合候補#5）。
        // よって本ケースは一次オラクル化できず、付帯表4#7「要確認（正典対応なし）」として別管理し自動化カウントには含めない。
        //   実装のエラー文言・ids[]という Form制約・リダイレクト挙動は期待値に固定しない（実装へ寄せない）。
      }
    );
  }
);
