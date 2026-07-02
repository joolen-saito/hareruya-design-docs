/**
 * 管理画面 店頭買取管理 買取集計データ（検索・一覧表示）（M06-08）E2E。納品ケース表
 * integration_test/e2e/m06_08_admin_store_purchase_purchase_store_summary_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要データ(SEED-M06-08-SUMMARY-DATA/NO-SECTION)・要実機確認は
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-08_admin_store_purchase_purchase_store_summary.md / 観点表)由来（オラクル独立性）。
 * 集計値・該当行・i18n文言の厳密検証はオラクルにせず、観測挙動（一覧描画可否・遷移先URL・空メッセージ）で判定する。
 * pf-eccube3(HareruyaEc)由来設計だが、刷新先 ec-cube-enterprise に同一画面(admin_otcbuyorder_summary)が実在するためE2E化した。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・two_factor_auth.spec.ts・m05 配下も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報(ECCUBE_ADMIN_USER/PASS)が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchasePurchaseStoreSummaryPage } from "../../../pages/admin/m06/m06_08_admin_store_purchase_purchase_store_summary.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// GET初期表示／CSV欠落時のリダイレクト先（admin_otcbuyorder_summary）。末尾に /search を許さない厳密形。
const SUMMARY_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary(\\?|$)`);
// 検索POST(admin_otcbuyorder_summary_search /summary/search)はリダイレクトせず同一テンプレを描画する。
// URLは /summary/search のまま留まるため、検索成功時はこの描画パスを期待する（仕様: 同一画面再描画）。
const SEARCH_RENDER_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/search(\\?|$)`);

// 仕様(設計書 エッジケース/エラー処理)由来の観測文言。i18n依存だが Twig 上の固定描画でありオラクルとして用いる。
const EMPTY_ENTIRE = "検索条件に該当する期間全体の集計データがありませんでした。"; // summary.twig:105
const EMPTY_DAYS = "検索条件に該当する日別の集計データがありませんでした。"; // summary.twig:158
const CSV_NO_SESSION = "検索条件がありません。先に検索を実行してください。"; // Controller.php:122 addError

// 集計行が存在しない期間（遠い未来）＝シード非依存で0件を誘発する。
const FUTURE_FROM = "2999-01-01";
const FUTURE_TO = "2999-12-31";
// 妥当な検索期間（過去〜現在）。データ有無に関わらず searched 真で #result_list が描画される。
const WIDE_FROM = "2000-01-01";
const WIDE_TO = "2999-12-31";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

/**
 * 既ロード済みページからブラウザ上でPOST送信し、サーバ応答（リダイレクト/フラッシュ描画）を
 * ブラウザ遷移として観測する。POST専用ルート(search/export)を画面遷移オラクルで確認するため。
 * このフォームはCSRF保護無効(OtcBuyOrderSummaryType.php:44-47)のためトークン無しで送信できる。
 */
async function browserPost(page: Page, actionPath: string) {
  await page.evaluate((url) => {
    const f = document.createElement("form");
    f.method = "POST";
    f.action = url;
    document.body.appendChild(f);
    f.submit();
  }, actionPath);
  await page.waitForLoadState("load");
}

test.describe(
  "店頭買取管理 > 買取集計データ（検索・一覧表示）",
  { tag: ["@admin", "@purchase_store", "@summary"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M06-08-040 未ログインで買取集計データURL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M06-08-041 未ログインで検索/CSV出力URLへ直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // POST専用ルート(search/export)はGET直叩きできないため、ブラウザからPOST遷移して
      // 管理FWのログイン誘導を画面遷移として観測する（040と同じオラクル＝ログイン画面表示）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/login`);
      await browserPost(page, `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/search`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();

      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/login`);
      await browserPost(page, `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/export`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== ログイン必須（SEED-M06-08-ADMIN） =====

    test("E2E-M06-08-001 GET初期表示で検索フォームのみ表示され一覧ブロックは出さない", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await summary.seeSearchForm();
      await summary.seeNoResultBlock(); // searched 偽: #result_list を描画しない
    });

    test("E2E-M06-08-002 検索フォームに集計日（開始）・（終了）入力欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await expect(summary.dateFrom).toBeVisible();
      await expect(summary.dateTo).toBeVisible();
    });

    test("E2E-M06-08-003 検索フォームに部門・買取店舗の選択欄と検索ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await expect(summary.section).toBeAttached(); // select2 がオーバーレイするため attached で確認
      await expect(summary.shop).toBeAttached();
      await expect(summary.searchButton).toBeVisible();
    });

    test("E2E-M06-08-004 サブタイトル「買取集計データ」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await expect(page.locator("body")).toContainText("買取集計データ"); // sub_title block(summary.twig:7)
    });

    test("E2E-M06-08-005 メインタイトル「店頭買取管理」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await expect(page.locator("body")).toContainText("店頭買取管理"); // title block trans admin.purchase.store.title
    });

    test("E2E-M06-08-010 有効な集計日範囲で検索すると検索結果ブロックが描画される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await summary.search(WIDE_FROM, WIDE_TO);
      // 検索POSTは /summary/search で同一テンプレを描画する（リダイレクトなし）。URLは search パスに留まる。
      await expect(page).toHaveURL(SEARCH_RENDER_RE);
      await expect(summary.resultList.first()).toBeVisible(); // searched 真: 検索結果領域が出る（#result_listは集計/日別で2個）
    });

    test("E2E-M06-08-011 妥当だが0件の期間で検索すると期間全体の空メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await summary.search(FUTURE_FROM, FUTURE_TO); // 集計行が存在しない遠未来期間
      await expect(page.locator("body")).toContainText(EMPTY_ENTIRE);
    });

    test("E2E-M06-08-012 妥当だが0件の期間で検索すると日別の空メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await summary.search(FUTURE_FROM, FUTURE_TO);
      await expect(page.locator("body")).toContainText(EMPTY_DAYS);
    });

    test("E2E-M06-08-020 集計日（開始）未入力で検索→一覧を出さず検索画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await summary.dateTo.fill(WIDE_TO);
      await summary.searchButton.click(); // 開始は空のまま送信
      await expect(summary.resultList).toHaveCount(0); // 検証失敗: 一覧非表示
    });

    test("E2E-M06-08-021 集計日（終了）未入力で検索→一覧を出さず検索画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      await summary.dateFrom.fill(WIDE_FROM);
      await summary.searchButton.click(); // 終了は空のまま送信
      await expect(summary.resultList).toHaveCount(0);
    });

    test("E2E-M06-08-022 集計日に日付不正値→検証失敗で一覧を出さない", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      // input type=date のクライアント制約で不正値が送信不可な場合は不具合候補#4の要実機確認に該当。
      await summary.dateFrom.fill("9999-99-99");
      await summary.dateTo.fill(WIDE_TO);
      await summary.searchButton.click();
      await expect(summary.resultList).toHaveCount(0);
    });

    test("E2E-M06-08-030 検索条件セッション無しでCSV出力→GET一覧へリダイレクト", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page); // 検索を実行しない＝セッションに条件なし
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary`);
      // ブラウザからCSV出力POST→GET買取集計データ(admin_otcbuyorder_summary)へリダイレクト(Controller.php:124)。
      await browserPost(page, `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/export`);
      await expect(page).toHaveURL(SUMMARY_RE); // /search を含まない初期画面URLへ戻る
    });

    test("E2E-M06-08-031 検索条件セッション無しでCSV出力→エラーメッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      // ブラウザからCSV出力POST→リダイレクト先のGET一覧でフラッシュエラーが描画されるのを画面上で観測する。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary`);
      await browserPost(page, `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/export`);
      await expect(page.locator("body")).toContainText(CSV_NO_SESSION); // フラッシュエラー(addError 'admin')
    });

    test("E2E-M06-08-032 検証失敗の検索後にCSV出力→セッション退避なしでGET一覧へリダイレクト＋エラー", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M06-08-ADMIN 未設定");
      await login(page);
      const summary = new StorePurchasePurchaseStoreSummaryPage(page);
      await summary.goto();
      // 検証失敗となる検索（集計日 空送信）。設計書: 検証失敗時はセッション退避を行わない。
      await summary.searchButton.click();
      await expect(summary.resultList).toHaveCount(0); // 検証失敗で一覧非表示
      // 続けてCSV出力 → セッションに条件が無いためGET一覧へリダイレクト＋フラッシュエラー。
      await browserPost(page, `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/export`);
      await expect(page).toHaveURL(SUMMARY_RE);
      await expect(page.locator("body")).toContainText(CSV_NO_SESSION);
    });

    // ===== 保留（要データ/要実機確認。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M06-08-013 集計表ヘッダ表示（要: SEED-M06-08-SUMMARY-DATA 集計行データ）",
      async () => {
        // 期待は仕様(フロント挙動: 集計＝部門別4列表)由来。既知集計行を投入後、見出し「集計」と
        // 列ヘッダ(部門コード/部門/買取金額/販売金額 summary.twig:82-85)を確認する。集計値はデータ依存=手動。
      }
    );

    test.fixme(
      "E2E-M06-08-014 日別表ヘッダ・CSVダウンロードボタン表示（要: SEED-M06-08-SUMMARY-DATA）",
      async () => {
        // 期待は仕様(フロント挙動: 日別＝日付付き5列表＋CSVダウンロード)由来。
        // 見出し「日別」・集計日列(summary.twig:133)・#result_list_main__csv_menu(summary.twig:122)を確認する。
      }
    );

    test.fixme(
      "E2E-M06-08-050 ナビ「店頭買取」配下メニューのアクティブ表示（要: activeクラスのセレクタ実機確認）",
      async () => {
        // 期待は仕様(利用者視点の入口: purchase_store/summary がアクティブ summary.twig:4)由来。
        // active クラスは default_frame 依存のため実機確認後に実装（不具合候補#5）。
      }
    );

    test.fixme(
      "E2E-M06-08-061 部門未設定の集計行は「未設定」で表示（要: SEED-M06-08-NO-SECTION section_id NULL行）",
      async () => {
        // 期待は仕様(集計条件: 部門未設定はTwigで定数「未設定」表示 summary.twig:93,146 MtbSection::NO_SECTION)由来。
        // section_id が欠ける集計行を投入後、部門名列に「未設定」が出ることを確認する。
      }
    );
  }
);
