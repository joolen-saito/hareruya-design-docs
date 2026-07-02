/**
 * 管理画面 在庫管理「バーコード貼替リストCSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m04_30_admin_stock_stock_barcode_replacement_list_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSV本文＝6列・商品名トリム・言語/状態・販売価格整形・バーコード生成、
 * 抽出条件・出力順、文字コードSJIS-win）・対象外（ログ出力・参照のみのDB無更新・入力欄に無いバリデーション細目）は
 * ケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-30_admin_stock_stock_barcode_replacement_list_csv_export.md
 *   / 基本設計仕様書(在庫管理機能))由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 刷新先 ec-cube-enterprise の同等ルート admin_stock_barcode_replacement_list /
 *   admin_stock_barcode_replacement_list_csv_export（BarcodeReplacementListController.php:40-94）の存在を確認済み。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(040)は資格情報不要。正常系ダウンロード(010-014)はログイン者に「デフォルト検索表示店舗」が
 *   設定済み、または選択可能な店舗（dtb_base_info）が1件以上存在することを要する（SEED-M04-30-STORE）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockBarcodeReplacementListCsvExportPage } from "../../../pages/admin/m04/m04_30_admin_stock_stock_barcode_replacement_list_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書「CSV出力仕様」由来（filename=barcode_replacement_list_<YmdHis>.csv）。
// 実装に合わせて変えない（オラクル独立性）。日時はリクエスト時刻で動的のため正規表現照合。
const FILENAME_RE = /^barcode_replacement_list_\d{14}\.csv$/;
const FILENAME_HEADER_RE = /filename=barcode_replacement_list_\d{14}\.csv/;
const LOGIN_RE = /\/login(\?|$)/;
const INDEX_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/barcode_replacement_list(\\?|$)`
);
// From>To の相関エラー文言（messages.ja.yaml:4546 を仕様として扱う。設計書「分岐・例外: From>To」由来）。
const ERR_PERIOD_INVALID =
  "価格変更発生期間の終了日は開始日以降を指定してください。";

// 期間ヘルパ（YYYY-MM-DD）。初期値仕様は前日/当日の「ローカル日付」（設計書「初期表示」）。
// toISOString()=UTC基準だと日本時間の早朝（JST 00:00-09:00=UTC前日）に日ズレして誤検出するため、
// ローカル日付コンポーネントで算出する（テストランナーのTZはサーバ(Asia/Tokyo)に合わせる前提）。
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const TODAY = ymd(new Date());
const YESTERDAY = ymd(new Date(Date.now() - 86400000));
// ちょうど1か月前（境界正常系 016 用）。月跨ぎの端数は仕様上「最大1か月」の上限内＝正常で十分。
function ymdMonthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return ymd(d);
}
const ONE_MONTH_AGO = ymdMonthsAgo(1);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > バーコード貼替リストCSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-30-040 未ログインで画面URLへアクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      const p = new StockStockBarcodeReplacementListCsvExportPage(page);
      await page.goto(p.indexUrl);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-30-041 未ログインでCSV出力POSTを送ると出力されずログイン誘導／拒否される", async ({
      page,
    }) => {
      const p = new StockStockBarcodeReplacementListCsvExportPage(page);
      // 設計書「管理画面ログインを要する」: GET画面(040)だけでなくCSV出力POSTも保護される。
      const resp = await p.postExportUnauthenticated();
      // CSVが返らない＝成功(2xx)でないこと。
      expect(resp.ok()).toBeFalsy();
      // ログイン誘導(3xx→/login)または認証拒否(401/403)。具体的形態は実機差異ありのため許容。
      expect([301, 302, 303, 307, 308, 401, 403]).toContain(resp.status());
      if (resp.status() >= 300 && resp.status() < 400) {
        expect(resp.headers()["location"] || "").toMatch(/login/);
      }
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      // --- UI部品・初期表示・URL直接アクセス ---

      test("E2E-M04-30-001 画面に店舗select・期間From/To・出力ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.seeForm();
      });

      test("E2E-M04-30-004 出力対象店舗selectが単一選択（multiple属性なし）である", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        // 設計書「出力対象店舗は1店舗のみ選択可能」: select は単一選択（multiple 属性を持たない）。
        await expect(p.baseInfoSelect).toBeVisible();
        expect(await p.baseInfoSelect.getAttribute("multiple")).toBeNull();
      });

      test("E2E-M04-30-002 価格変更発生期間の初期値が From=前日 / To=当日 である", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        // 設計書「初期表示」: Fromに前日、Toに当日。
        await expect(p.periodFrom).toHaveValue(YESTERDAY);
        await expect(p.periodTo).toHaveValue(TODAY);
      });

      test("E2E-M04-30-003 画面URLへ直接GETアクセスすると検索フォームが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await page.goto(p.indexUrl);
        await expect(page).toHaveURL(INDEX_RE);
        await expect(p.submitButton).toBeVisible();
      });

      // --- 正常系: CSVダウンロード（要 SEED-M04-30-STORE＝選択可能な店舗1件以上） ---

      test("E2E-M04-30-010 有効な店舗・期間を指定して送信するとCSVダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        await p.setPeriod(YESTERDAY, TODAY);
        const download = await p.submitAndDownload();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M04-30-011 ダウンロードファイル名が barcode_replacement_list_<日時>.csv 形式である", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        await p.setPeriod(YESTERDAY, TODAY);
        const download = await p.submitAndDownload();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M04-30-012 CSV出力応答が attachment; filename=barcode_replacement_list_<日時>.csv を返す", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        await p.setPeriod(YESTERDAY, TODAY);
        const { response } = await p.submitAndCapture();
        const cd = response.headers()["content-disposition"] || "";
        expect(cd).toContain("attachment");
        expect(cd).toMatch(FILENAME_HEADER_RE);
      });

      test("E2E-M04-30-013 CSV出力応答のContent-Typeが application/octet-stream である", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        await p.setPeriod(YESTERDAY, TODAY);
        const { response } = await p.submitAndCapture();
        expect(response.headers()["content-type"]).toContain(
          "application/octet-stream"
        );
      });

      test("E2E-M04-30-014 該当0件の期間でもヘッダ行のみのCSVダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        // 価格変更履歴が存在しない過去期間を指定（設計書「分岐・例外: 対象0件＝ヘッダ行のみ出力」）。
        await p.setPeriod("2000-01-01", "2000-01-31");
        const download = await p.submitAndDownload();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      test("E2E-M04-30-015 ダウンロード時に確認ダイアログを介さない", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        await p.setPeriod(YESTERDAY, TODAY);
        let dialogShown = false;
        page.on("dialog", async (d) => {
          dialogShown = true;
          await d.dismiss();
        });
        await p.submitAndDownload();
        expect(dialogShown).toBe(false);
      });

      test("E2E-M04-30-016 価格変更発生期間がちょうど1か月の指定は正常にダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        // 設計書「価格変更発生期間は最大1か月」の上限内＝正常（024 1か月超の境界正常系）。
        await p.setPeriod(ONE_MONTH_AGO, TODAY);
        const download = await p.submitAndDownload();
        expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      });

      // --- 異常系: バリデーションNG→画面（index）へ戻りエラー表示 ---

      test("E2E-M04-30-020 出力対象店舗を未選択で送信するとエラー表示され画面に戻る", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.clearStore(); // placeholder=未選択（NotBlank）
        await p.setPeriod(YESTERDAY, TODAY);
        await p.submit();
        // 設計書「必須未入力（店舗）→エラー表示しindexへリダイレクト」。
        await expect(page).toHaveURL(INDEX_RE);
        await expect(p.error).toBeVisible();
      });

      test("E2E-M04-30-021 価格変更発生期間Fromを未入力で送信するとエラー表示され画面に戻る", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        await p.setPeriod("", TODAY); // From未入力（NotBlank）
        await p.submit();
        await expect(page).toHaveURL(INDEX_RE);
        await expect(p.error).toBeVisible();
      });

      test("E2E-M04-30-022 価格変更発生期間Toを未入力で送信するとエラー表示され画面に戻る", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        await p.setPeriod(YESTERDAY, ""); // To未入力（NotBlank）
        await p.submit();
        await expect(page).toHaveURL(INDEX_RE);
        await expect(p.error).toBeVisible();
      });

      test("E2E-M04-30-023 From>Toを指定して送信すると相関エラー文言が表示され画面に戻る", async ({ page }) => {
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        await p.setPeriod(TODAY, YESTERDAY); // From > To
        await p.submit();
        await expect(page).toHaveURL(INDEX_RE);
        // 設計書「分岐・例外: From>To」＝admin.stock.barcode_replacement_list.price_change_period_invalid。
        await expect(p.error).toContainText(ERR_PERIOD_INVALID);
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-30-024 価格変更発生期間が1か月超でエラー（要: 1か月上限バリデーション実装。現状未実装＝仕様乖離・失敗で検出見込み）",
      async ({ page }) => {
        // 期待は仕様(Excel「価格変更発生期間は最大1か月」/設計書 実装要確認)由来。
        // 現実装(BarcodeReplacementListType POST_SUBMIT)は From>To のみ検証し1か月上限が無い（不具合候補#1）。
        // テストは仕様どおり「1か月超→エラー＆画面に戻る」を期待値とし、実装が違えば落ちて検出する。
        await login(page);
        const p = new StockStockBarcodeReplacementListCsvExportPage(page);
        await p.goto();
        await p.selectStore();
        await p.setPeriod("2026-01-01", "2026-03-01"); // 1か月超
        await p.submit();
        await expect(page).toHaveURL(INDEX_RE);
        await expect(p.error).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M04-30-030 CSRFトークン不正のPOSTは拒否される（要: 実機でのトークン改ざん手順確認）",
      async () => {
        // 期待は仕様(プロセスフロー2 isTokenValid()／分岐・例外「CSRF不正」)由来。
        // ブラウザ操作では正規トークンが自動付与されるため、トークン改ざんPOSTの安定手順を実機確認後に実装する。
      }
    );
  }
);
