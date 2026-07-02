/**
 * 店頭買取管理「買取商品履歴 選択CSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m06_07_admin_store_purchase_purchase_store_history_select_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSVファイル内容＝列順・12列ヘッダ・会員ID/申込者の空・
 * 買取日時 "Y年m月d日 H時i分" 形式・三位区切りなし・並び順・BOM/エンコーディング/区切り文字・存在しないIDのみ→
 * ヘッダのみ）／対象外（CSRF=FW内部、set_time_limit/StreamedResponse内部、ログ抑止、参照のみで更新なし＝DB副作用、
 * IT-23検索条件＝別機能の一覧検索へ委譲、IT-22のフィールド長/数値/文字種＝本機能は配列必須以外の入力検証なし）は
 * ケース表で全量管理し、spec に大量の fixme を残さない（規約準拠）。要実機/環境依存の分のみ test.fixme で残す。
 *
 * 期待結果は仕様(functions/pf-eccube3/m06-07_admin_store_purchase_purchase_store_history_select_csv_export.md /
 * OtcBuyOrderHistoryController.php / OtcBuyOrderHistoryCsvExportService.php / messages.ja.yaml)由来（オラクル独立性）。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 * 検索結果行は買取商品履歴のシード（SEED-M06-07-HISTORY）に依存し、0件時は test.skip でガードする。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchasePurchaseStoreHistorySelectCsvExportPage } from "../../../pages/admin/m06/m06_07_admin_store_purchase_purchase_store_history_select_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
// 未認証ガードは管理ログイン画面 /<admin_route>/login へ誘導される。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 買取商品履歴一覧（admin_otcbuyorder_history）または保存済みページ（admin_otcbuyorder_history_page）。
const HISTORY_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history(/page/\\d+)?(\\?|$)`
);
// 未選択送信時の正典遷移先は admin_otcbuyorder_history_page = /otcbuyorder/history/page/{page_no}
// （Controller.php:160-162）。保存済み page_no 参照を検証するため /page/{n} を必須にする。
const HISTORY_PAGE_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history/page/\\d+(\\?|$)`
);
// 仕様: ファイル名 otc_buy_order_history_{YmdHis}.csv（Service.php:100）。
const FILENAME_RE = /^otc_buy_order_history_\d{14}\.csv$/;

// 仕様(Controller.php:158 ハードコード)由来のフラッシュ文言。実装に合わせて変えない（オラクル独立性）。
const ERR_NO_SELECTION = "1つ以上の商品を選択してください";

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

/** 一覧へ行き全件検索して結果を出す。結果0件なら skip 用の件数を返す。 */
async function openListAndSearch(
  page: Page
): Promise<StorePurchasePurchaseStoreHistorySelectCsvExportPage> {
  const p = new StorePurchasePurchaseStoreHistorySelectCsvExportPage(page);
  await p.gotoList();
  await p.searchAll();
  return p;
}

test.describe(
  "店頭買取管理 > 買取商品履歴 選択CSV出力",
  { tag: ["@admin", "@purchase", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M06-07-040 未ログインで選択CSV出力ルート直アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 未認証は管理画面共通制約でログインへ。CSV を返さない。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history/export`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M06-07-041 未ログインで買取商品履歴一覧URL直アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 入口（非表示系）：検索前/結果0件は result_form・CSVメニュー非描画（認証要・シード非依存） =====

    test("E2E-M06-07-004 検索前（一覧初期表示）は「選択した商品履歴取得」メニューが描画されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StorePurchasePurchaseStoreHistorySelectCsvExportPage(page);
      // 仕様(入口): CSV用 result_form は検索後かつ pagination が与えられたときのみ存在する。
      // 検索前は一覧ブロックが無く、選択CSVメニューは描画されない（設計書「利用者視点の入口」3行目）。
      await p.gotoList();
      await expect(p.checkExportLink).toHaveCount(0);
    });

    test("E2E-M06-07-005 検索実行して結果0件のとき「選択した商品履歴取得」メニューが描画されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new StorePurchasePurchaseStoreHistorySelectCsvExportPage(page);
      await p.gotoList();
      // 仕様(入口): 結果0件では一覧ブロックの選択CSVメニューを描画しない。
      // 査定番号にヒットしない値で検索→0件（twig:254 の空メッセージのみ）。004(検索前非表示)の異常系対。
      await p.searchNoHit();
      await expect(
        page.getByText("検索条件に該当するデータがありませんでした。")
      ).toBeVisible();
      await expect(p.checkExportLink).toHaveCount(0);
    });

    // ===== UI部品・全選択（認証要・要シード履歴） =====

    test("E2E-M06-07-001 検索結果1件以上で「選択した商品履歴取得」メニューが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取商品履歴が無い（SEED-M06-07-HISTORY）");
      // 仕様(フロント挙動): result_form は検索後 pagination 有りのときのみ存在し、CSVダウンロード内に
      // 「選択した商品履歴取得」がある（history.twig:160,186,189）。
      await p.seeCheckExportMenu();
    });

    test("E2E-M06-07-002 各履歴行に選択チェックと全選択#allCheckが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      const count = await p.resultCount();
      test.skip(count === 0, "買取商品履歴が無い（SEED-M06-07-HISTORY）");
      // 仕様(フロント挙動): 先頭列に #allCheck、各行に name="otcBuyOrderHistoryIds[]" のチェックがある。
      await expect(p.allCheck).toBeVisible();
      expect(await p.rowCheckboxes.count()).toBeGreaterThan(0);
    });

    test("E2E-M06-07-003 #allCheckで全行チェックが一括ONになる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      const count = await p.resultCount();
      test.skip(count === 0, "買取商品履歴が無い（SEED-M06-07-HISTORY）");
      // 仕様(JS挙動): #allCheck で otcBuyOrderHistoryId 属性を持つ行チェックを一括ON/OFFする。
      await p.allCheck.check();
      const n = await p.rowCheckboxes.count();
      for (let i = 0; i < n; i++) {
        await expect(p.rowCheckboxes.nth(i)).toBeChecked();
      }
    });

    test("E2E-M06-07-006 #allCheckで全行チェックが一括OFFになる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      const count = await p.resultCount();
      test.skip(count === 0, "買取商品履歴が無い（SEED-M06-07-HISTORY）");
      // 仕様(JS挙動): #allCheck で行チェックを一括ON/OFFする。003(ON)の異常系対＝OFF側。
      await p.allCheck.check();
      await p.allCheck.uncheck();
      const n = await p.rowCheckboxes.count();
      for (let i = 0; i < n; i++) {
        await expect(p.rowCheckboxes.nth(i)).not.toBeChecked();
      }
    });

    // ===== 選択CSV出力 成功（認証要・要シード履歴） =====

    test("E2E-M06-07-010 行を選択し「選択した商品履歴取得」→ダウンロード発火・ファイル名 otc_buy_order_history_{YmdHis}.csv", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取商品履歴が無い（SEED-M06-07-HISTORY）");
      await p.checkFirstRow();
      const download = await p.clickCheckExportAndWaitDownload();
      // 仕様: filename="otc_buy_order_history_{YmdHis}.csv"。CSVの中身は手動確認（ケース表 付帯表）。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    test("E2E-M06-07-011 選択CSV出力POST→octet-stream の添付応答が返る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      const count = await p.resultCount();
      test.skip(count === 0, "買取商品履歴が無い（SEED-M06-07-HISTORY）");
      // ブラウザの実フォーム送信で発火する出力応答を観測する（CSRFトークンやFormフィールド等の送信内容は
      // ブラウザに委ね、こちらで組み立てない＝CSRF未使用などの実装由来オラクルを混入させない）。
      // 期待は仕様(入出力/処理フロー#7,#8): octet-stream・attachment・ファイル名接頭辞のみ。
      await p.checkFirstRow();
      const [res] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes("/otcbuyorder/history/export") &&
            r.request().method() === "POST"
        ),
        page.waitForEvent("download").catch(() => null),
        p.openMenuAndClickCheckExport(),
      ]);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"] || "").toContain("application/octet-stream");
      const contentDisposition = res.headers()["content-disposition"] || "";
      expect(contentDisposition).toContain("attachment");
      expect(contentDisposition).toContain("otc_buy_order_history_");
    });

    test("E2E-M06-07-030 選択CSV出力時に確認ダイアログ（モーダル/alert）を表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取商品履歴が無い（SEED-M06-07-HISTORY）");
      // 設計フロント挙動: 出力確認ダイアログは無い・送信前の件数チェックもしない。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      await p.checkFirstRow();
      const download = await p.clickCheckExportAndWaitDownload();
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      expect(dialogShown, "出力前の確認ダイアログは表示されない").toBe(false);
    });

    // ===== 未選択エラー（認証要・要シード履歴） =====

    test("E2E-M06-07-020 未選択で「選択した商品履歴取得」→フラッシュ「1つ以上の商品を選択してください」を表示", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取商品履歴が無い（SEED-M06-07-HISTORY）");
      // 仕様(判定順序#2/エラー処理): otcBuyOrderHistoryIds 空→固定文言のエラーフラッシュ。
      await p.clickCheckExportWithoutSelection();
      await expect(p.dangerAlert).toContainText(ERR_NO_SELECTION);
    });

    test("E2E-M06-07-021 未選択送信→保存済みページの買取商品履歴一覧へリダイレクトし滞留する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取商品履歴が無い（SEED-M06-07-HISTORY）");
      // 仕様(画面遷移): admin_otcbuyorder_history_page（保存済み page_no）= /history/page/{page_no} へ
      // リダイレクトされる。CSVは返らない。/history だけでは保存済み page_no 参照を検証できないため /page/{n} を必須にする。
      await p.clickCheckExportWithoutSelection();
      await expect(page).toHaveURL(HISTORY_PAGE_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M06-07-050 export_type が不正値／欠損で選択CSV出力POST→例外応答（要実機: 応答はFW・環境設定依存）",
      async () => {
        // 期待は仕様(バリデーション/エラー処理/エッジケース)由来: 不正値も欠損も match のデフォルトに落ち
        // InvalidArgumentException となる（設計書「export_type欠損・不正値」/「export_typeが期待値以外」）。
        // 欠損（export_type キー自体なし）と不正値（check_export/all_export 以外）はリクエスト形が異なるため
        // 両系を確認する。HTTPステータス/本文は環境設定(APP_ENV/エラーページ)に依存するため実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M06-07-012 出力CSV構造（12列ヘッダ順・BOM・存在しないIDのみ→ヘッダのみ）（要実機: encoding/separator/seed依存）",
      async () => {
        // 期待は仕様(出力列とデータの対応=12列固定日本語列順 / 入出力=eccube_csv_export_encoding が UTF-8 のとき BOM
        // / 判定順序#3=0件でもヘッダのみ)由来。CSV本文は Playwright の download/response 本文で観測可能だが、
        // 列の文字エンコーディング（eccube_csv_export_encoding）と区切り文字（eccube_csv_export_separator）は
        // 環境設定キー依存、列値・並び順はシード決定性に依存するため、E2E-050 同様に環境を固定して実機確認後に実装する。
      }
    );
  }
);
