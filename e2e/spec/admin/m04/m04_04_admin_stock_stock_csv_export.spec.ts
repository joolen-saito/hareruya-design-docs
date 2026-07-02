/**
 * 管理画面 在庫管理「在庫情報CSV出力」E2E（M04-04）。
 * 納品ケース表 integration_test/e2e/m04_04_admin_stock_stock_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。CSV構造（0件時ヘッダ行のみ＝1行・ヘッダ列数19）は
 * ダウンロードファイルから自動検証する（期待値は設計書由来）。手動（CSV各列の値・見出し文言・SJIS-win変換・
 * 削除レコード除外）・手動/間接（セッション不整合の出力失敗＝要状態注入）・対象外（GETにつきCSRFなし・
 * DB内部取得元値・参照のみ・ログ出力抑止）はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-04_admin_stock_stock_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約・Cookie名は期待値に流用しない。
 * 文言（エラーメッセージ）の照合に用いる文字列は設計書が参照する trans キーの locale 値（messages.ja.yaml）を
 * 根拠とし、実装コードの定数を写したものではない。
 * 刷新先 ec-cube-enterprise に当該機能が存在することを確認済み:
 *   route admin_stock_list_csv = GET /<route>/product/stock/csv（StockListController.php:213）/ 起点ボタン stock_list_index.twig:447。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(030)は資格情報不要。CSV本文検査・セッション不整合はシード/特殊状態が要るためケース表(付帯表3/4)で管理する。
 */
import { test, expect, Page, Download } from "@playwright/test";
import { readFileSync } from "node:fs";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockCsvExportPage } from "../../../pages/admin/m04/m04_04_admin_stock_stock_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書 CSV出力仕様「ファイル名 stock_list_<YmdHis>.csv」（StockListController/StockListCsvExportService:96 はルート実在確認の補助）。
// 実装に合わせて変えない（オラクル独立性）。日時はリクエスト時刻で動的のため正規表現照合。
const FILENAME_RE = /^stock_list_\d{14}\.csv$/;
const STOCK_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;
// 検索未実行時のエラー文言（messages.ja.yaml:4419）。仕様由来でハードコードせず実装の現挙動を写さない。
const ERR_SEARCH_REQUIRED = "検索条件を指定してからCSV出力してください。";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

/**
 * ダウンロードCSVの構造（実データ行を除いた骨格）を読む。
 * カンマ(0x2C)はSJIS-win(CP932)の先頭/後続バイト域に現れないため、生バイトを latin1 で1:1写像して
 * カンマ分割しても列数判定は文字コードに依存せず安全（見出し文言は手動確認に委ねる）。
 */
async function readCsvStructure(
  download: Download
): Promise<{ lineCount: number; headerColumnCount: number }> {
  const path = await download.path();
  const raw = readFileSync(path).toString("latin1");
  const lines = raw.split(/\r\n|\n|\r/).filter((l) => l.length > 0);
  const headerColumnCount = lines.length > 0 ? lines[0].split(",").length : 0;
  return { lineCount: lines.length, headerColumnCount };
}

test.describe(
  "管理画面 在庫管理 > 在庫情報CSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-04-030 未ログインでCSV出力URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockCsvExportPage(page);
      await p.gotoExport();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M04-04-001 在庫一覧画面（CSV出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockCsvExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(STOCK_LIST_RE);
        await p.seeListScreen();
      });

      test("E2E-M04-04-020 検索未実行でCSV出力URLへアクセスするとエラーが表示される", async ({ page }) => {
        // 新規コンテキスト＝セッションに検索条件なし。直接GETで検索未実行分岐を踏む。
        await login(page);
        const p = new StockStockCsvExportPage(page);
        await p.gotoExport();
        await expect(p.errorAlert).toContainText(ERR_SEARCH_REQUIRED); // 判定: エラーメッセージ表示
      });

      test("E2E-M04-04-021 検索未実行時は在庫一覧へリダイレクトされCSVを出力しない", async ({ page }) => {
        await login(page);
        const p = new StockStockCsvExportPage(page);
        let downloadStarted = false;
        page.on("download", () => {
          downloadStarted = true;
        });
        await p.gotoExport();
        await expect(page).toHaveURL(STOCK_LIST_RE); // 判定: 在庫一覧へリダイレクト
        expect(downloadStarted).toBe(false); // CSVダウンロードは発火しない
      });

      // ===== 検索実行後（セッションに検索条件あり）＝正常系ダウンロード =====

      test("E2E-M04-04-010 検索実行後にCSV出力URLへ直接GETするとダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockCsvExportPage(page);
        await p.runSearch(); // セッション admin.stock.list.search を確定（空条件でも可）
        const download = await p.downloadViaDirectGet();
        expect(download).toBeTruthy(); // download イベントが発火（HTML一覧へ遷移しない）
      });

      test("E2E-M04-04-011 ダウンロードファイル名が stock_list_<日時>.csv 形式である", async ({ page }) => {
        await login(page);
        const p = new StockStockCsvExportPage(page);
        await p.runSearch();
        const download = await p.downloadViaDirectGet();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M04-04-012 エクスポート応答が添付ファイル（octet-stream/attachment）のHTTPヘッダを返す", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockCsvExportPage(page);
        await p.runSearch();
        // 認証済みブラウザコンテキストのCookie（セッション）を共有する request で応答ヘッダを観測する。
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(200);
        const headers = res.headers();
        expect(headers["content-type"]).toContain("application/octet-stream");
        expect(headers["content-disposition"]).toContain("attachment");
        expect(headers["content-disposition"]).toMatch(/filename=stock_list_\d{14}\.csv/);
      });

      test("E2E-M04-04-002 検索結果がある場合に「在庫情報CSV出力」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockCsvExportPage(page);
        await p.runSearch();
        // 前提: 検索結果あり（SEED-M04-04-STOCK）。未投入環境では検索結果0件となりボタン非表示が正しい挙動のためskipし、
        // 偽陽性の失敗を避ける（seedは付帯表3で管理。投入後に有効化）。
        test.skip(
          !(await p.hasSearchResults()),
          "在庫データ未投入（SEED-M04-04-STOCK）のため検索結果0件＝ボタン非表示が正。seed投入後に検証する"
        );
        // ボタンは pagination が空でない（検索結果あり）場合のみ表示（stock_list_index.twig:439）。
        await expect(p.csvExportLink).toBeVisible();
      });

      test("E2E-M04-04-013 「在庫情報CSV出力」ボタン押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockCsvExportPage(page);
        await p.runSearch();
        test.skip(
          !(await p.hasSearchResults()),
          "在庫データ未投入（SEED-M04-04-STOCK）のため検索結果0件＝ボタン非表示。seed投入後に検証する"
        );
        const download = await p.downloadViaButton();
        expect(download).toBeTruthy();
      });

      // ===== CSV構造の自動検証（0件＝ヘッダ行のみ・列数19。期待値は設計書由来。各列の値は手動） =====

      test("E2E-M04-04-050 検索結果0件のときヘッダ行(19列)のみのCSVが出力される", async ({ page }) => {
        await login(page);
        const p = new StockStockCsvExportPage(page);
        await p.runSearchNoHit(); // 存在しない商品コードで0件検索＝セッションに0件条件を確定（DBシード不要）
        const download = await p.downloadViaDirectGet();
        const { lineCount, headerColumnCount } = await readCsvStructure(download);
        // 期待は設計書「対象0件＝ヘッダ行のみ」(:103) と「出力列数19」(:55)。実装値の写しではない。
        expect(lineCount).toBe(1); // データ行なし＝ヘッダ1行のみ
        expect(headerColumnCount).toBe(19); // ヘッダ列数19
      });
    });

    // E2E-M04-04-040（セッション検索条件が現行フォームと不整合→エラー表示＋一覧へ戻る）は、
    // 不整合セッションの安定注入（SEED-M04-04-BADSESSION）が要るため手動/間接とし、specには残さず
    // ケース表（付帯表1/3/4/5）で管理する（規約「手動/対象外はspecに残さない」）。
    // 期待は仕様 分岐・例外 セッション不整合（log_error＋reset＋admin.stock.list.search_required_for_csv表示＋一覧リダイレクト）由来。
  }
);
