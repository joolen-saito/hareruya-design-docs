/**
 * 管理画面 店頭買取管理「買取集計データCSV出力」E2E（M06-09）。
 * 納品ケース表 integration_test/e2e/m06_09_admin_store_purchase_otc_buy_order_summary_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。CSVヘッダの固定列順（列ラベル）と0件時ヘッダ行のみは設計書由来で自動化する
 * （010/013）。一方、各行の値・件数の対象データ一致は要DBシードのため手動とし、日別CSVボタンの出現条件（要データ）・
 * 確認ダイアログ非存在（要データ）・情報ログ・JS資産（日付ピッカー/select2）の付与は手動/対象外とし、
 * ケース表（付帯表2/2b/5）で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-09_admin_store_purchase_otc_buy_order_summary_csv_export.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・Form制約(required/csrf_protection)・Cookie名は期待値に流用しない。
 * 設計源は pf-eccube3 リバースだが、刷新先 ec-cube-enterprise に同一画面が実在するためE2E化した:
 *   OtcBuyOrderSummaryController.php:49/68/113（summary GET / search POST / export POST）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(021)は資格情報不要。export はPOST専用のため、認証済みブラウザコンテキストの
 * Cookie(セッション)を共有する page.request.post で応答ヘッダ/リダイレクトを観測する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchaseOtcBuyOrderSummaryCsvExportPage } from "../../../pages/admin/m06/m06_09_admin_store_purchase_otc_buy_order_summary_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は仕様(入出力「ファイル名 otc_buy_order_summary_ + YmdHis + .csv」)由来。日時は動的のため正規表現照合。
const FILENAME_RE = /otc_buy_order_summary_\d{14}\.csv/;
// セッション欠如時の固定エラーフラッシュ（設計書 処理フロー(CSV)#3 の固定和文）。実装に合わせて変えない。
const NO_CONDITION_MSG = "検索条件がありません。先に検索を実行してください。";

// CSVヘッダ列ラベル（設計書「出力列とデータの対応」由来の固定列順）。
// 区切り文字・引用符・BOM は設定(eccube_csv_export_encoding 等)依存のためオラクル化せず、列ラベルの並びのみ照合する。
const CSV_HEADER_LABELS = ["集計日", "部門コード", "部門", "買取金額", "販売金額"];

// CSV本文を行配列へ。先頭BOMは設定依存なので有無を問わず除去し、空行は無視する（区切り/引用符には依存しない照合）。
function csvLines(text: string): string[] {
  return text
    .replace(/^﻿/, "")
    .split(/\r\n|\n|\r/)
    .filter((l) => l.length > 0);
}

const SUMMARY_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary(\\?|$|/)`);
const SEARCH_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/search(\\?|$)`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$|/)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 店頭買取管理 > 買取集計データCSV出力",
  { tag: ["@admin", "@otcbuyorder", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M06-09-021 未ログインでCSV出力URLへ直接POST→管理ログインへ誘導", async ({ page }) => {
      const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
      const res = await p.postExport(0); // 未認証セッションでexport POST
      expect(res.status()).toBe(302); // 管理ファイアウォールがログインへ誘導
      expect(res.headers()["location"]).toMatch(LOGIN_RE); // ECCUBE_ADMIN_ROUTE配下の管理ログインであること
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M06-09-001 買取集計データ画面に検索フォーム（集計日・検索ボタン）が表示される", async ({ page }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        await p.gotoSummary();
        await expect(page).toHaveURL(SUMMARY_RE);
        await p.seeSearchForm(); // ロール属性なしで到達でき検索フォームが開く（権限・認可/フロント挙動）
      });

      test("E2E-M06-09-002 集計日を指定して検索すると集計結果領域が表示される", async ({ page }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        await p.gotoSummary();
        await p.search("2000-01-01", "2030-12-31"); // 有効な期間（form有効）
        await expect(page).toHaveURL(SEARCH_RE);
        await p.seeResultArea(); // 期間全体/日別の結果領域が描画される（データ有無は問わない）
      });

      test("E2E-M06-09-003 集計日を空にした無効検索は結果なしテンプレ(200)でCSVボタンを描画しない", async ({ page }) => {
        // 設計書 処理フロー(検索)#2「未送信または無効なら結果なしのテンプレートを返し、セッションキーは更新しない」
        // ／フロント挙動「CSVダウンロードは検索後かつ日別1行以上のときだけ描画」由来（無効検索＝日別なし→ボタン非描画）。
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        // 集計日を空のまま検索POST（HTML5 required を介さずサーバ判定を観測）。
        const res = await page.request.post(p.searchPath, {
          form: {
            "admin_otc_buy_order_summary[summary_date_from]": "",
            "admin_otc_buy_order_summary[summary_date_to]": "",
          },
          maxRedirects: 0,
        });
        expect(res.status()).toBe(200); // 結果なしテンプレを再描画（リダイレクト/エラーにならない）
        const body = await res.text();
        // 日別CSVダウンロードボタンは描画されない（無効検索では日別1行以上の条件を満たさない）。
        expect(body).not.toContain("result_list_main__csv_menu");
      });

      test("E2E-M06-09-010 検索成功後にexport POSTでCSVが添付ダウンロードされる", async ({ page }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        await p.gotoSummary();
        await p.search("2000-01-01", "2030-12-31"); // セッションに検索条件が保存される
        const res = await p.postExport(0);
        expect(res.status()).toBe(200); // ストリーム応答（リダイレクトしない）
        expect(res.headers()["content-disposition"]).toContain("attachment");
        // 設計書「出力列とデータの対応」の固定列順ヘッダが1行目に出ること（列ラベルは仕様由来）。
        // 各行の値・件数の対象データ一致は要DBシードのため手動（オラクル独立性を保つため値照合はしない）。
        const lines = csvLines(await res.text());
        for (const label of CSV_HEADER_LABELS) expect(lines[0]).toContain(label);
      });

      test("E2E-M06-09-011 export応答のファイル名が otc_buy_order_summary_<日時>.csv 形式である", async ({ page }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        await p.gotoSummary();
        await p.search("2000-01-01", "2030-12-31");
        const res = await p.postExport(0);
        expect(res.headers()["content-disposition"]).toMatch(FILENAME_RE);
      });

      test("E2E-M06-09-012 export応答が octet-stream / attachment のHTTPヘッダと200を返す", async ({ page }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        await p.gotoSummary();
        await p.search("2000-01-01", "2030-12-31");
        const res = await p.postExport(0);
        expect(res.status()).toBe(200);
        expect(res.headers()["content-type"]).toContain("application/octet-stream");
        expect(res.headers()["content-disposition"]).toContain("attachment");
      });

      test("E2E-M06-09-013 該当0件想定の期間でもexportはCSV(ヘッダ行のみ)応答を返す（エラーにならない）", async ({ page }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        await p.gotoSummary();
        // 要確認: 0件は対象期間にデータが無いことに依存。データ独立を保証するには専用シード(SEED-M06-09-SUMMARY-DATA外の空期間)が望ましい。
        await p.search("1990-01-01", "1990-01-02"); // 0件想定の期間。form有効ならセッションは保存される
        const res = await p.postExport(0);
        expect(res.status()).toBe(200); // 0件でもエラー・リダイレクトにならずCSVが返る
        expect(res.headers()["content-type"]).toContain("application/octet-stream");
        // 設計書 エッジケース「該当0件→ストリームはヘッダ行のみ（テストで1行のみを確認）」由来。
        const lines = csvLines(await res.text());
        expect(lines).toHaveLength(1); // データ行なし＝ヘッダ1行のみ
        for (const label of CSV_HEADER_LABELS) expect(lines[0]).toContain(label);
      });

      test("E2E-M06-09-020 検索条件なしでexport POST→302で買取集計データ画面へリダイレクト", async ({ page }) => {
        // 一度も検索していないためセッションに検索条件が無い状態。
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        const res = await p.postExport(0);
        expect(res.status()).toBe(302); // 失敗時出力＝302リダイレクト
        expect(res.headers()["location"]).toMatch(SUMMARY_RE); // ECCUBE_ADMIN_ROUTE配下の買取集計データ画面
      });

      test("E2E-M06-09-032 成功検索後に無効検索をしても直前の検索条件が残りexportは200CSVを返す", async ({ page }) => {
        // 設計書 データ整合性「セッションは最後に成功した検索の条件である。検索失敗時は直前値が残る」
        // ／セッション「検索POSTが送信されかつフォームが有効なときのみ上書き」由来。
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        await p.gotoSummary();
        await p.search("2000-01-01", "2030-12-31"); // 有効検索でセッションに条件保存
        // 続けて無効検索（必須空）を送る。無効はセッションを上書きせず直前の成功条件が残る。
        await page.request.post(p.searchPath, {
          form: {
            "admin_otc_buy_order_summary[summary_date_from]": "",
            "admin_otc_buy_order_summary[summary_date_to]": "",
          },
          maxRedirects: 0,
        });
        const res = await p.postExport(0);
        expect(res.status()).toBe(200); // 直前条件が残るため条件なし302にはならずCSVを返す
        expect(res.headers()["content-disposition"]).toContain("attachment");
      });

      test("E2E-M06-09-026 検索条件なしexport後の画面表示で固定エラーフラッシュが出る", async ({ page }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        await p.postExport(0); // フラッシュをセッションに積む（リダイレクトは追わない）
        await p.gotoSummary(); // リダイレクト先の描画でフラッシュが消費・表示される
        await expect(page).toHaveURL(SUMMARY_RE); // ECCUBE_ADMIN_ROUTE配下の買取集計データ画面
        await expect(page.locator("body")).toContainText(NO_CONDITION_MSG);
      });

      test("E2E-M06-09-030 集計日未入力(必須)の検索はセッションに保存されずexportが条件なし扱いになる", async ({ page }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        // 集計日を空で検索POST（form無効＝セッション更新しない）。HTML5 required を介さずサーバ判定を観測する。
        await page.request.post(p.searchPath, {
          form: {
            "admin_otc_buy_order_summary[summary_date_from]": "",
            "admin_otc_buy_order_summary[summary_date_to]": "",
          },
          maxRedirects: 0,
        });
        const res = await p.postExport(0);
        expect(res.status()).toBe(302); // 条件が保存されていない＝条件なしリダイレクト
        expect(res.headers()["location"]).toMatch(SUMMARY_RE); // ECCUBE_ADMIN_ROUTE配下の買取集計データ画面
      });

      test("E2E-M06-09-031 日付として解釈不可な集計日の検索はセッションに保存されない", async ({ page }) => {
        await login(page);
        const p = new StorePurchaseOtcBuyOrderSummaryCsvExportPage(page);
        await page.request.post(p.searchPath, {
          form: {
            "admin_otc_buy_order_summary[summary_date_from]": "not-a-date",
            "admin_otc_buy_order_summary[summary_date_to]": "not-a-date",
          },
          maxRedirects: 0,
        });
        const res = await p.postExport(0);
        expect(res.status()).toBe(302); // 無効入力で検索却下→セッション未更新→条件なしリダイレクト
        expect(res.headers()["location"]).toMatch(SUMMARY_RE); // ECCUBE_ADMIN_ROUTE配下の買取集計データ画面
      });
    });
  }
);
