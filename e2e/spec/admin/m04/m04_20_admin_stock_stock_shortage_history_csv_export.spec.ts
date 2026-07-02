/**
 * 管理画面 在庫管理「欠品履歴CSV出力」E2E（M04-20）。
 * 納品ケース表 integration_test/e2e/m04_20_admin_stock_stock_shortage_history_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、要実機/未確定は理由付き test.fixme で残す。
 * 手動（CSV本文＝列・値・対象データ一致・行順・文字コード）・間接（参照のみ＝業務データ非更新）・
 * 対象外（入力フォーム非保持のバリデーション群・ログ抑止・確認ダイアログ・CSRF・DB内部値）はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(Excel基本設計書 M04-20 / functions/ec-cube-enterprise/m04-20_admin_stock_stock_shortage_history_csv_export.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・Form制約・固定ヘッダ列（実装15列）・ファイル名prefixは期待値に流用しない。
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み:
 *   route admin_stock_history_disposal_csv_export = POST /<route>/product/stock/history/disposal/csv_export（StockHistoryController.php:318）/
 *   起点は在庫履歴一覧（admin_stock_history）を欠品検索(disposal_search)状態にしたときの「CSVダウンロード」ボタン
 *   （has_search_disposal==true で formaction が disposal ルートへ切替・history.twig:597-601）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 設計乖離（付帯表4参照・テストは仕様どおりに書き、実装が違えば落ちて検出）:
 *  - Excel設計のCSV列は16列（…登録元ID・在庫区分…）だが、実装 disposal ヘッダは15列で「在庫区分」を「在庫場所」、
 *    「登録元ID」列を欠く（StockHistoryController.php:423-442）。テストはExcel期待値=16列で設計（CSV内容は手動）。
 *  - 対象ID空時のエラー trans キー admin.stock_history.not_select が messages.ja.yaml に未定義（実在は admin.stock.history.* 系）。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。欠品検索の結果（廃棄系の在庫履歴）が無いとCSVボタンが描画されないため、
 * 002/003/010-013 は欠品履歴データのシード(SEED-M04-20-DISPOSAL)前提（無い環境では失敗＝抜け漏れ可視化）。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M04-20-ADMIN    : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（在庫管理に到達できる管理者・2FA OFF）
 *  - SEED-M04-20-DISPOSAL : 廃棄系（廃棄/欠品減算（受注）/欠品減算（移動））の dtb_stock_history を複数件（欠品検索でヒットする）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockShortageHistoryCsvExportPage } from "../../../pages/admin/m04/m04_20_admin_stock_stock_shortage_history_csv_export.page";
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
// 在庫履歴一覧の画面タイトル（仕様: 欠品履歴CSV出力の起点画面）。
const TITLE = "在庫履歴一覧";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 欠品履歴CSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-20-020 未ログインで在庫履歴一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockShortageHistoryCsvExportPage(page);
      await p.gotoList();
      await expect(page).toHaveURL(LOGIN_RE); // 未ログイン管理者はアクセス不可（権限・認可）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M04-20-001 在庫履歴一覧画面（欠品履歴CSV出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockShortageHistoryCsvExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(HISTORY_RE);
        await p.seeListScreen();
        await expect(p.title).toContainText(TITLE);
      });

      test("E2E-M04-20-002 欠品検索を実行すると「CSVダウンロード」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockShortageHistoryCsvExportPage(page);
        await p.runDisposalSearch();
        // CSV出力フォームは pagination.totalItemCount>0（欠品履歴の検索結果あり）の場合のみ描画（history.twig:565）。
        await expect(p.disposalCsvButton).toBeVisible();
      });

      test("E2E-M04-20-003 欠品検索結果ありでCSVボタンのformactionが欠品履歴CSV出力ルートである", async ({ page }) => {
        await login(page);
        const p = new StockStockShortageHistoryCsvExportPage(page);
        await p.runDisposalSearch();
        // has_search_disposal==true で formaction が欠品履歴CSV出力ルートへ切替わること（仕様: 欠品履歴は disposal 系へ出力）。
        await expect(p.disposalCsvButton).toHaveAttribute(
          "formaction",
          new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/history/disposal/csv_export$`)
        );
      });

      test("E2E-M04-20-010 欠品検索状態でCSVダウンロード押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockShortageHistoryCsvExportPage(page);
        await p.runDisposalSearch();
        const download = await p.downloadViaButton();
        expect(download).toBeTruthy(); // 正常時出力＝StreamedResponse（200・添付）でCSVダウンロード発火
      });

      test("E2E-M04-20-011 欠品履歴CSVが添付ファイル（.csvファイル）として発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockShortageHistoryCsvExportPage(page);
        await p.runDisposalSearch();
        // download イベントの発火自体が添付（attachment）応答であることを示し、.csv 拡張子で「CSVファイル」を判定する。
        const download = await p.downloadViaButton();
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      });

      test("E2E-M04-20-012 CSV出力は画面遷移せず一覧に滞留しダウンロードのみ行われる", async ({ page }) => {
        await login(page);
        const p = new StockStockShortageHistoryCsvExportPage(page);
        await p.runDisposalSearch();
        const urlBefore = page.url();
        const download = await p.downloadViaButton();
        expect(download).toBeTruthy();
        await expect(page).toHaveURL(HISTORY_RE); // ダウンロード後も在庫履歴一覧に滞留（画面遷移なし）
        expect(page.url()).toBe(urlBefore);
      });

      test("E2E-M04-20-013 ダウンロードファイル名が stock_history_disposal_<YmdHis>.csv 形式である", async ({ page }) => {
        await login(page);
        const p = new StockStockShortageHistoryCsvExportPage(page);
        await p.runDisposalSearch();
        // 仕様(正本md「文字コード・ファイル名・レスポンス」)由来: stock_history_disposal_ + 出力時刻 YmdHis + .csv。
        const download = await p.downloadViaButton();
        expect(download.suggestedFilename()).toMatch(/^stock_history_disposal_\d{14}\.csv$/);
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-20-021 未ログインで欠品履歴CSV出力URL直接→管理ログイン画面へ誘導（要: POST専用ルートの未認証到達手順の実機確認）",
      async () => {
        // 期待は仕様(未ログイン管理者はアクセス不可)由来。admin_stock_history_disposal_csv_export は POST専用のため、
        // GETナビゲーションでは405/ログイン誘導いずれかになり得る。未認証到達の観測手順を実機確認後に実装する（付帯表4#3）。
      }
    );

    test.fixme(
      "E2E-M04-20-030 対象ID無しで欠品履歴CSV出力POST→一覧へリダイレクト＋エラーで出力されない（要: 直接POST手順／trans欠落の実機確認）",
      async () => {
        // 期待は仕様(分岐・遷移・例外: 有効ID0件→responseNoStockHistoryIdError でエラー表示＋admin_stock_history_page へリダイレクト)由来。
        // 通常UIでは ids[] が自動付与されるため ids無しは直接POSTでのみ到達。
        // trans キー admin.stock_history.not_select は未定義（付帯表4#2）。
        // リダイレクト先は session key eccube.admin.stock_history.search.page_no 既定1参照のため「現在ページ」へ戻らずページ1へ寄る可能性あり（付帯表4#7）。
        // 期待は仕様(現在ページ滞留)どおりに置き、戻り先がズレれば検出。手順確定後に実装する。
      }
    );

    test.fixme(
      "E2E-M04-20-031 欠品検索結果ゼロ件のとき「CSVダウンロード」ボタンが表示されない（要: 0件ヒットする欠品検索条件のシード/手順）",
      async () => {
        // 期待は仕様(検索結果なし時は出力導線なし＝pagination.totalItemCount>0 のときのみ描画 history.twig:565)由来。
        // 廃棄系履歴が0件ヒットする欠品検索条件を安定生成する手順を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M04-20-032 存在しないIDで欠品履歴CSV出力POST→エラー表示でリダイレクトし出力されない（要: 直接POST手順）",
      async () => {
        // 期待は仕様(分岐・遷移・例外: 該当履歴なし/変換結果空→RuntimeException→addError＋リファラ or 一覧へリダイレクト)由来。
        // 存在しないID(例 999999)の直接POST手順を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M04-20-014 有効ID＋無効ID（0/-1/空）混在で有効IDのみ採用しCSVダウンロードが発火する（要: 直接POST手順）",
      async () => {
        // 期待は仕様(起動方法: intval変換し0以下を除外し有効IDのみ採用＝境界の正常側／正本md:60)由来。
        // 通常UIでは ids[] が自動付与されるため混在は直接POSTでのみ到達。有効IDが1件以上あればDL発火を期待。手順確定後に実装する。
      }
    );

    test.fixme(
      "E2E-M04-20-022 ログイン済みでも欠品履歴CSV出力URLへGET直アクセスするとCSVが出力されない（要: POST専用ルートのGET到達応答の実機確認）",
      async () => {
        // 期待は仕様(利用者視点の入口: 入口はPOSTのみ／正本md:59・route methods:['POST'])由来。
        // GET直アクセスは405等になりダウンロードは発火しない。GET到達時の応答(405/リダイレクト)を実機確認後に実装する。
      }
    );
  }
);
