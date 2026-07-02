/**
 * 管理画面 受注管理「受注情報CSV出力」E2E（M05-02）。
 * 納品ケース表 integration_test/e2e/m05_02_admin_order_order_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。CSV各列の値・見出し文言・明細単位の行数・BOM/エンコード・
 * 列定義0件の論理例外（要DB操作）・セッション検索条件一致（CSV内容の手動照合）はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-02_admin_order_order_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約・Cookie名は期待値に流用しない。設計源は pf-eccube3 リバースだが、
 * DB・挙動は刷新先 ec-cube-enterprise を上位とせず基本設計/設計書を上位オラクルとし、当該画面の存在を確認済み:
 *   route admin_order_export_order = GET /<route>/order/export/order（OrderController.php:374）/
 *   起点リンク id=orderCsvDownload（Order/index.twig:1141）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderCsvExportPage } from "../../../pages/admin/m05/m05_02_admin_order_order_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書「ファイル名は接頭辞 order_ と日時 YmdHis と拡張子 .csv」(処理フロー#11) 由来。
// 実装に合わせて変えない（オラクル独立性）。日時はリクエスト時刻で動的のため正規表現照合。
const FILENAME_RE = /^order_\d{14}\.csv$/;
const ORDER_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/order(\\?|$|/)`);
// 未認証ガードの誘導先は管理画面共通ログイン（/<route>/login）。別ログイン画面で誤通過しないよう管理ルートまで固定する。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 > 受注情報CSV出力",
  { tag: ["@admin", "@order", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M05-02-020 未ログインでCSV出力URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new OrderOrderCsvExportPage(page);
      await p.gotoExport();
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M05-02-001 受注一覧（CSV出力の起点）が表示される", async ({ page }) => {
        await login(page);
        const p = new OrderOrderCsvExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(ORDER_LIST_RE);
        await p.seeListScreen(); // 「CSVダウンロード」ボタンが表示される
      });

      test("E2E-M05-02-002 CSVダウンロードドロップダウンに「受注CSVダウンロード」リンクが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = new OrderOrderCsvExportPage(page);
        await p.gotoList();
        await p.seeOrderCsvLink(); // id=orderCsvDownload / 文言 受注CSVダウンロード
      });

      test("E2E-M05-02-003 「受注CSVダウンロード」は受注CSV出力URLへの通常アンカーで確認モーダルがない", async ({
        page,
      }) => {
        await login(page);
        const p = new OrderOrderCsvExportPage(page);
        await p.gotoList();
        await p.openCsvDropdown();
        // 通常アンカー（href が受注CSV出力ルート）であること。確認モーダル属性(data-bs-toggle=modal)を持たない。
        await expect(p.orderCsvLink).toHaveAttribute("href", /\/order\/export\/order$/);
        await expect(p.orderCsvLink).not.toHaveAttribute("data-bs-toggle", "modal");
      });

      test("E2E-M05-02-010 「受注CSVダウンロード」押下でCSVダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new OrderOrderCsvExportPage(page);
        await p.gotoList();
        const download = await p.downloadViaLink();
        expect(download).toBeTruthy(); // download イベントが発火（HTML画面遷移しない）
      });

      test("E2E-M05-02-011 受注CSV出力URLへ直接GETするとダウンロードが発火する", async ({ page }) => {
        // セッションに検索データが無い新規コンテキストでも、設計上は既定検索で出力されうる（エッジケース）。
        await login(page);
        const p = new OrderOrderCsvExportPage(page);
        const download = await p.downloadViaDirectGet();
        expect(download).toBeTruthy();
      });

      test("E2E-M05-02-012 ダウンロードファイル名が order_<日時>.csv 形式である", async ({ page }) => {
        await login(page);
        const p = new OrderOrderCsvExportPage(page);
        const download = await p.downloadViaDirectGet();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M05-02-013 エクスポート応答が octet-stream/attachment のHTTPヘッダを返す", async ({
        page,
      }) => {
        await login(page);
        const p = new OrderOrderCsvExportPage(page);
        // 認証済みブラウザコンテキストのCookie（セッション）を共有する request で応答ヘッダを観測する。
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(200);
        const headers = res.headers();
        expect(headers["content-type"]).toContain("application/octet-stream");
        expect(headers["content-disposition"]).toContain("attachment");
        expect(headers["content-disposition"]).toMatch(/filename=order_\d{14}\.csv/);
      });

      test("E2E-M05-02-014 セッションに検索データが無くてもダウンロードが発火する（既定検索）", async ({
        page,
      }) => {
        // エッジケース「セッションに検索データが無い」＝空に近い既定検索で処理されダウンロードは成立する（エラーにならない）。
        await login(page);
        const p = new OrderOrderCsvExportPage(page);
        const download = await p.downloadViaDirectGet();
        expect(download).toBeTruthy();
      });

      test("E2E-M05-02-030 CSV出力はHTML画面遷移を伴わずダウンロードのみが発火する", async ({ page }) => {
        await login(page);
        const p = new OrderOrderCsvExportPage(page);
        await p.gotoList();
        const urlBefore = page.url();
        const download = await p.downloadViaLink();
        expect(download).toBeTruthy();
        // 添付応答のため一覧URLから別HTML画面へ遷移しない（画面遷移はブラウザ次第＝ダウンロードのみ）。
        await expect(page).toHaveURL(urlBefore);
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    // E2E-M05-02-040（有効な受注CSV列定義が0件→ヘッダ出力処理が論理例外）は、dtb_csv の受注CSV種別 enabled 行を
    // すべて0件にするDB状態の注入（SEED-M05-02-CSVDEF-EMPTY）が必要で、共有環境では破壊的なため手動/間接とし、
    // specには残さずケース表（付帯表3/4/5）で管理する。期待は仕様 エラー処理「列定義が空＝論理例外」由来。
    test.fixme(
      "E2E-M05-02-040 列定義0件で論理例外（要DB: 受注CSV種別の enabled 列を0件化／共有環境では破壊的）",
      async () => {
        // 期待は仕様(エッジケース/エラー処理「有効な受注CSV列定義が0件→ヘッダ出力処理が論理例外」)由来。
        // SEED-M05-02-CSVDEF-EMPTY の隔離投入後に実装する。
      }
    );
  }
);
