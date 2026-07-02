/**
 * 管理画面 イベント管理「イベント申込CSV出力（CSVダウンロード）」E2E（M13-09）。
 * 納品ケース表 integration_test/e2e/m13_09_admin_event_event_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。CSV各列の値・見出し・並び順・BOM/文字コード・論理削除データ包含・
 * 検索条件セッションの母集合一致・デッキ起点抽出・ログ出力抑止はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-09_admin_event_event_csv_export.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・Form制約・内部セッションキー名・searchMode内部値は期待値に流用しない。設計源は pf-eccube3 リバースだが、
 * 基本設計/設計書を上位オラクルとし、刷新先 ec-cube-enterprise に当該画面の存在を確認済み:
 *   一覧 admin_event_entry = GET/POST /<route>/event/entry（EntryController.php:93）/
 *   出力 admin_event_entry_csv_export = GET /<route>/event/entry/csv（EntryController.php:340）/
 *   起点リンク #entryCsvDownloadDropDown 内 href=admin_event_entry_csv_export（Event/Entry/index.twig:353,358）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(020)は資格情報不要。詳細指定(015)は EVENT_DETAIL_ID が無ければ skip。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventCsvExportPage } from "../../../pages/admin/m13/m13_09_admin_event_event_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 詳細指定の一覧→出力（E2E-015）用。既存のイベント詳細ID（無ければ skip）。
const EVENT_DETAIL_ID = process.env.EVENT_DETAIL_ID || "";

// 期待値は設計書「ファイル名は接頭辞 event_entry_ と日時 YmdHis と拡張子 .csv」(業務ルール・処理フロー#8) 由来。
// 実装に合わせて変えない（オラクル独立性）。日時はリクエスト時刻で動的のため正規表現照合。
const FILENAME_RE = /^event_entry_\d{14}\.csv$/;
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/entry(\\?|$|/)`);
// 未認証ガードの誘導先は管理画面共通ログイン（/<route>/login）。別ログイン画面で誤通過しないよう管理ルートまで固定する。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 イベント管理 > イベント申込CSV出力",
  { tag: ["@admin", "@event", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M13-09-020 未ログインで出力URL→管理ログイン画面へ誘導（出力しない）", async ({ page }) => {
      const p = new EventEventCsvExportPage(page);
      await p.gotoExport();
      await expect(page).toHaveURL(LOGIN_RE); // 認証・権限不足時は出力しない（エラー処理/権限・認可）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M13-09-001 イベント申込一覧（CSV出力の起点）に「CSVダウンロード」ボタンが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = new EventEventCsvExportPage(page);
        await p.gotoList();
        await expect(page).toHaveURL(LIST_RE);
        await p.seeListScreen(); // #entryCsvDownloadDropDown が表示される
      });

      test("E2E-M13-09-002 ドロップダウン内に出力URLを指す「CSVダウンロード」リンクが表示される", async ({
        page,
      }) => {
        await login(page);
        const p = new EventEventCsvExportPage(page);
        await p.gotoList();
        await p.seeCsvExportLink(); // href=admin_event_entry_csv_export
      });

      test("E2E-M13-09-003 出力リンクは出力URLへの通常アンカーで確認モーダルがない", async ({ page }) => {
        await login(page);
        const p = new EventEventCsvExportPage(page);
        await p.gotoList();
        await p.openCsvDropdown();
        // オラクルは仕様（フロント挙動「本機能専用のモーダルは無い」）由来＝確認モーダル属性(data-bs-toggle=modal)を持たないこと。
        // 出力先URL（/event/entry/csv）は刷新先の位置情報でありオラクルにしない（正典の入口URLは /entry/export＝ケース表付帯表4#2 で乖離管理）。
        await expect(p.csvExportLink).toBeVisible(); // 通常アンカー（GETリンク）が存在する
        await expect(p.csvExportLink).not.toHaveAttribute("data-bs-toggle", "modal");
      });

      test("E2E-M13-09-010 出力リンク押下でCSVダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new EventEventCsvExportPage(page);
        await p.gotoList();
        const download = await p.downloadViaLink();
        expect(download).toBeTruthy(); // download イベントが発火（HTML画面遷移しない）
      });

      test("E2E-M13-09-011 出力URLへ直接GETするとダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new EventEventCsvExportPage(page);
        const download = await p.downloadViaDirectGet();
        expect(download).toBeTruthy(); // 画面遷移せずCSVを出力する（画面遷移節）
      });

      test("E2E-M13-09-012 ダウンロードファイル名が event_entry_<日時>.csv 形式である", async ({ page }) => {
        await login(page);
        const p = new EventEventCsvExportPage(page);
        const download = await p.downloadViaDirectGet();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M13-09-013 エクスポート応答が octet-stream/attachment のHTTPヘッダを返す", async ({
        page,
      }) => {
        await login(page);
        const p = new EventEventCsvExportPage(page);
        // 認証済みブラウザコンテキストのCookie（セッション）を共有する request で応答ヘッダを観測する。
        const res = await page.request.get(p.exportPath);
        expect(res.status()).toBe(200);
        const headers = res.headers();
        expect(headers["content-type"]).toContain("application/octet-stream");
        expect(headers["content-disposition"]).toContain("attachment");
        expect(headers["content-disposition"]).toMatch(/filename=event_entry_\d{14}\.csv/);
      });

      test("E2E-M13-09-014 検索条件セッションが空でも既定検索でダウンロードが発火する（出力は失敗しない）", async ({
        page,
      }) => {
        // エラー処理「検索条件セッションが空→既定の検索条件で全件を対象に出力する」由来＝空でも成立する（失敗ではない）。
        await login(page);
        const p = new EventEventCsvExportPage(page);
        const download = await p.downloadViaDirectGet();
        expect(download).toBeTruthy();
      });

      test("E2E-M13-09-015 イベント詳細指定の一覧からCSVダウンロードが発火する", async ({ page }) => {
        test.skip(!EVENT_DETAIL_ID, "EVENT_DETAIL_ID 未設定（イベント詳細指定の検証用）");
        await login(page);
        const p = new EventEventCsvExportPage(page);
        await p.gotoEventDetailList(EVENT_DETAIL_ID); // 詳細で絞り込み→検索条件セッションへ反映
        const download = await p.downloadViaLink();
        expect(download).toBeTruthy(); // 母集合一致（中身）は手動。発火のみ自動化
      });

      test("E2E-M13-09-030 CSV出力はHTML画面遷移を伴わずダウンロードのみが発火する", async ({ page }) => {
        await login(page);
        const p = new EventEventCsvExportPage(page);
        await p.gotoList();
        const urlBefore = page.url();
        const download = await p.downloadViaLink();
        expect(download).toBeTruthy();
        // 添付応答のため一覧URLから別HTML画面へ遷移しない（CSVのダウンロードのみで画面遷移は伴わない）。
        await expect(page).toHaveURL(urlBefore);
      });
    });
  }
);
