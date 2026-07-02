/**
 * ネット買取管理「入金CSV」出力 E2E。
 * 納品ケース表 integration_test/e2e/m07_05_admin_online_purchase_purchase_csv_export_deposit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動（CSVファイル内容＝10列ヘッダ順・銀行/支店コード値・口座種別/口座番号/
 * 名義・振込金額=送料+査定額・本人確認名称・結合行なし時の空文字・一部存在時の存在分昇順出力・BOM/エンコーディング/区切り文字・
 * ファイル名内の最小ID7桁/YmdHis値）／対象外（CSRF=本ルートはトークン未検証でFW内部・観測外、set_time_limit/StreamedResponse内部、
 * ログ出力抑止、DB更新なし＝登録内容/トランザクション/ロック、IT-23検索条件＝別機能の一覧検索へ委譲、
 * IT-22の文字列長/数値/文字種/部分入力＝本機能はチェックボックス選択のみで該当入力欄なし、CSS display:block静的）は
 * ケース表で全量管理し、spec に大量の fixme を残さない（規約準拠）。要実機/環境依存の分のみ test.fixme で残す。
 *
 * 期待結果は仕様(functions/pf-eccube3/m07-05_admin_online_purchase_purchase_csv_export_deposit.md /
 * PurchaseController.php / BuyOrderDepositCsvExportService.php / messages.ja.yaml)由来（オラクル独立性）。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 * 検索結果行は買取注文のシード（SEED-M07-05-BUYORDER）に依存し、0件時は test.skip でガードする。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OnlinePurchasePurchaseCsvExportDepositPage } from "../../../pages/admin/m07/m07_05_admin_online_purchase_purchase_csv_export_deposit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
// 未認証ガードは管理ログイン画面 /<admin_route>/login へ誘導される。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 買取一覧ページ（admin_purchase_page = /purchase/page/{page_no}）。空ID/不在IDの正典遷移先。
// page_no 値はセッション(eccube.admin.purchase.search.page_no)依存のため値は固定せず書式一致で判定（不具合候補#3）。
const PURCHASE_PAGE_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/purchase/page/\\d+(\\?|$)`
);
// 仕様: ファイル名 purchase_bank_deposit_{最小IDを7桁ゼロ埋め}_{YmdHis14桁}.csv（設計書処理フロー#9）。
// 「7桁ゼロ埋め」は最小幅であり、ID が 8桁以上のシードでは桁が増える（不具合候補#5）。
// 桁数を 7 固定にすると大きいIDで偽陰性になるため、書式判定は 7桁以上(\d{7,}) とする。
const FILENAME_RE = /^purchase_bank_deposit_\d{7,}_\d{14}\.csv$/;

// 仕様(messages.ja.yaml)由来のフラッシュ文言。実装に合わせて変えない（オラクル独立性）。
const ERR_NO_SELECTION = "1つ以上の買取注文情報を選択してください。"; // :5247
const ERR_NOT_REGISTERED = "存在しない買取注文情報IDが含まれています。"; // :5248
// 仕様(purchase.js:17)由来のクライアントalert文言。
const JS_ALERT = "CSV出力する買取注文情報をひとつ以上選択してください。";

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

/** 一覧へ行き全件検索して結果を出す。 */
async function openListAndSearch(
  page: Page
): Promise<OnlinePurchasePurchaseCsvExportDepositPage> {
  const p = new OnlinePurchasePurchaseCsvExportDepositPage(page);
  await p.gotoList();
  await p.searchAll();
  return p;
}

test.describe(
  "ネット買取管理 > 入金CSV出力",
  { tag: ["@admin", "@purchase", "@csv"] },
  () => {
    // ===== 未認証（資格情報不要・非破壊） =====

    test("E2E-M07-05-030 未ログインで入金CSVルートへPOST→管理ログインへリダイレクト", async ({ page }) => {
      // 権限・認可（処理フロー#1）: 未認証は管理画面共通制約でログインへ。CSV を返さない。
      // 本ルートはPOST専用(Controller.php:564)。GETで叩くと認可ガードより先にルーティングのメソッド不許可
      // (405=別ケース032)に化け、未認証ガードの観測にならない。よってPOSTで認可ガードのみを観測する。
      const res = await page.request.post(`/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_deposit`, {
        form: {},
        maxRedirects: 0,
      });
      expect(res.status()).toBe(302);
      expect(res.headers()["location"] || "").toMatch(
        new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`)
      );
    });

    test("E2E-M07-05-031 未ログインで買取一覧URL直アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/list`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 入口（非表示系）：検索前は pagination 無しでダウンロード非描画（認証要・シード非依存） =====

    test("E2E-M07-05-002 検索前（一覧初期表示）はダウンロードフォーム・入金CSVが描画されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OnlinePurchasePurchaseCsvExportDepositPage(page);
      // 仕様(利用者視点の入口/フロント挙動): #bulk_csv_export と入金CSVは pagination が描画される条件でのみ出る。
      // 初期表示は pagination=[] のため非描画（PurchaseController.php index 戻り値）。
      await p.gotoList();
      await expect(p.bulkCsvForm).toHaveCount(0);
      await expect(p.depositCsvButton).toHaveCount(0);
    });

    test("E2E-M07-05-005 検索結果が無い表示ではダウンロードフォーム・入金CSVが描画されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = new OnlinePurchasePurchaseCsvExportDepositPage(page);
      // 仕様(利用者視点の入口/フロント挙動): ダウンロード用フォーム・入金CSVは結果が描画される条件でのみ出る。
      // 結果行が出ない状態（範囲外ページ）を作り、行が0件なら入金CSV/出力フォームも非描画であることを確認する。
      await p.gotoListPage(99999);
      test.skip((await p.resultCount()) > 0, "範囲外ページが結果行を返した（0件状態を作れない）");
      await expect(p.bulkCsvForm).toHaveCount(0);
      await expect(p.depositCsvButton).toHaveCount(0);
    });

    // ===== UI部品・全選択（認証要・要シード買取注文） =====

    test("E2E-M07-05-001 検索結果1件以上で「ダウンロード」内に「入金CSV」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取注文が無い（SEED-M07-05-BUYORDER）");
      await p.seeDepositCsvMenu();
    });

    test("E2E-M07-05-003 各買取注文行に選択チェックと全選択#allCheckが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取注文が無い（SEED-M07-05-BUYORDER）");
      // 仕様(フロント挙動): 表頭 #allCheck、各行に name="buyOrderIds[]" のチェックがある。
      await expect(p.allCheck).toBeVisible();
      expect(await p.rowCheckboxes.count()).toBeGreaterThan(0);
    });

    test("E2E-M07-05-004 #allCheckで全行チェックが一括ONになる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取注文が無い（SEED-M07-05-BUYORDER）");
      // 仕様(JS挙動 purchase.js:2-5): #allCheck で buyOrderId 属性付き行チェックを一括ON/OFF。
      await p.allCheck.check();
      const n = await p.rowCheckboxes.count();
      for (let i = 0; i < n; i++) {
        await expect(p.rowCheckboxes.nth(i)).toBeChecked();
      }
    });

    test("E2E-M07-05-013 「入金CSV」のformactionと出力フォームのmethodが規則どおり", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取注文が無い（SEED-M07-05-BUYORDER）");
      // 仕様(利用者視点の入口): bulk_csv_export は既定action無し・method=POST、入金CSVボタンは formaction で本ルートへ差し替える。
      await expect(p.bulkCsvForm).toHaveAttribute("method", /post/i);
      await expect(p.depositCsvButton).toHaveAttribute(
        "formaction",
        /\/purchase\/csv_export_deposit$/
      );
    });

    // ===== 入金CSV出力 成功（認証要・要シード買取注文） =====

    test("E2E-M07-05-010 行を選択し「入金CSV」→ダウンロード発火・ファイル名 purchase_bank_deposit_{7桁}_{YmdHis}.csv", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取注文が無い（SEED-M07-05-BUYORDER）");
      await p.checkFirstRow();
      const download = await p.clickDepositCsvAndWaitDownload();
      // 仕様(処理フロー#9): filename="purchase_bank_deposit_{最小ID7桁}_{YmdHis}.csv"。中身は手動確認（ケース表 040）。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    test("E2E-M07-05-011 入金CSV出力POST→octet-stream/attachment の応答が返る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取注文が無い（SEED-M07-05-BUYORDER）");
      // ブラウザの実フォーム送信で発火する出力応答を観測する（送信内容はブラウザに委ね、CSRF等の実装由来オラクルを混入させない）。
      // 期待は仕様(処理フロー#8,#9): octet-stream・attachment・ファイル名接頭辞のみ。
      await p.checkFirstRow();
      const [res] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes("/purchase/csv_export_deposit") &&
            r.request().method() === "POST"
        ),
        page.waitForEvent("download").catch(() => null),
        p.openMenuAndClickDepositCsv(),
      ]);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"] || "").toContain("application/octet-stream");
      const contentDisposition = res.headers()["content-disposition"] || "";
      expect(contentDisposition).toContain("attachment");
      expect(contentDisposition).toContain("purchase_bank_deposit_");
    });

    test("E2E-M07-05-012 入金CSV出力時に確認ダイアログ（モーダル）を表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取注文が無い（SEED-M07-05-BUYORDER）");
      // 設計フロント挙動: 出力前の確認ダイアログはない（行選択済みなのでJSアラートも出ない）。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      await p.checkFirstRow();
      const download = await p.clickDepositCsvAndWaitDownload();
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      expect(dialogShown, "出力前の確認ダイアログは表示されない").toBe(false);
    });

    test("E2E-M07-05-014 複数行選択→ファイル名の数値部が選択ID集合の最小値（7桁以上ゼロ埋め）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      const ids = await p.rowCheckboxValues();
      test.skip(ids.length < 2, "2件以上の買取注文が無い（SEED-M07-05-BUYORDER 2件以上）");
      // 仕様(処理フロー#9): ファイル名の数値部は渡されたID集合の最小値を7桁ゼロ埋め（最小幅）したもの。
      // 全行を選択し、DOM上の選択ID値の最小値が反映されることを観測する（中身は手動・ケース表045）。
      await p.allCheck.check();
      const minId = Math.min(...ids);
      const download = await p.clickDepositCsvAndWaitDownload();
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
      // 最小ID（7桁以上ゼロ埋め）がファイル名の数値部に現れる。
      const expectedNum = String(minId).padStart(7, "0");
      expect(download.suggestedFilename()).toContain(
        `purchase_bank_deposit_${expectedNum}_`
      );
    });

    // ===== 未選択（JS抑止・認証要・要シード買取注文） =====

    test("E2E-M07-05-020 未選択で「入金CSV」→アラートで送信が抑止される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const p = await openListAndSearch(page);
      test.skip((await p.resultCount()) === 0, "買取注文が無い（SEED-M07-05-BUYORDER）");
      // 仕様(JS挙動 purchase.js:13-19): チェック0件→alert文言を出し false を返して送信しない。
      let alertText = "";
      let navigated = false;
      page.on("dialog", async (d) => {
        alertText = d.message();
        await d.dismiss();
      });
      page.on("framenavigated", () => {
        navigated = true;
      });
      await p.openCsvMenu();
      await p.depositCsvButton.click();
      await expect.poll(() => alertText).toContain(JS_ALERT);
      // POSTされず一覧に留まる（出力ルートへ遷移しない）。
      expect(navigated).toBe(false);
    });

    // ===== 空ID / 不在ID（サーバ側・JS抑止を介さない直接POSTで観測） =====

    test("E2E-M07-05-022 買取注文ID空送信→買取一覧ページ(admin_purchase_page)へ302リダイレクト", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page); // ログイン済セッションCookieを page.request が共有する
      // クライアントJSは未選択送信を抑止するため、サーバ側分岐(処理フロー#4)はJSを介さず直接POSTして観測する。
      const res = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_deposit`,
        { form: {}, maxRedirects: 0 } // buyOrderIds なし＝空配列
      );
      expect(res.status()).toBe(302);
      // 仕様(処理フロー#4): redirectToPurchaseSearchResult→admin_purchase_page。値はセッション依存のため書式一致で判定。
      expect(res.headers()["location"] || "").toMatch(/\/purchase\/page\/\d+/);
    });

    test("E2E-M07-05-024 存在しないIDのみ送信→買取一覧ページへ302リダイレクト", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      // 仕様(処理フロー#5/エッジケース): 全ID不在→例外メッセージをフラッシュし買取一覧へリダイレクト。CSVは返さない。
      const res = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_deposit`,
        { form: { "buyOrderIds[]": "99999999" }, maxRedirects: 0 }
      );
      expect(res.status()).toBe(302);
      expect(res.headers()["location"] || "").toMatch(/\/purchase\/page\/\d+/);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M07-05-021 買取注文ID空送信→フラッシュ「1つ以上の買取注文情報を選択してください。」（要実機: JS抑止回避＋リダイレクト先のフラッシュ表示タイミング）",
      async () => {
        // 期待は仕様(処理フロー#4 / messages.ja.yaml:5247)由来。クライアントJS(purchase.js:13-19)が
        // 未選択送信を抑止するため、ブラウザ操作ではサーバ側フラッシュ分岐へ到達しない。直接POSTすると
        // フラッシュはリダイレクト先GETで消費されるため、表示観測は実機(セッション共有/フラッシュ描画)確認後に実装する。
        // 文言: ERR_NO_SELECTION = "1つ以上の買取注文情報を選択してください。"
        void ERR_NO_SELECTION;
      }
    );

    test.fixme(
      "E2E-M07-05-023 存在しないIDのみ送信→フラッシュ「存在しない買取注文情報IDが含まれています。」（要実機: フラッシュ表示タイミング）",
      async () => {
        // 期待は仕様(処理フロー#5 / Service.php:62 RuntimeException / messages.ja.yaml:5248)由来。
        // 022/024 でリダイレクト(302→admin_purchase_page)は確認済。フラッシュ文言の画面表示観測は実機確認後に実装する。
        // 文言: ERR_NOT_REGISTERED = "存在しない買取注文情報IDが含まれています。"
        void ERR_NOT_REGISTERED;
      }
    );

    test.fixme(
      "E2E-M07-05-032 入金CSVルートへGET直アクセス→405相当（要実機: HTTP応答/エラーページはFW・APP_ENV依存）",
      async () => {
        // 期待は仕様(利用者視点の入口: POST専用ルート Controller.php:564 methods=['POST'])由来。
        // GETは許可されずCSVを返さない。ステータス/本文表現は環境(APP_ENV/エラーページ)依存のため実機確認後に実装する。
      }
    );
  }
);
