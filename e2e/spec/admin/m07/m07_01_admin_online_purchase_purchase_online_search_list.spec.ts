/**
 * 管理画面 ネット買取管理 買取検索一覧（M07-01）E2E。納品ケース表
 * integration_test/e2e/m07_01_admin_online_purchase_purchase_online_search_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要データ十分性・要実機確認は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m07-01_admin_online_purchase_purchase_online_search_list.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来設計だが、刷新先 ec-cube-enterprise に同一画面(admin_purchase_list)が実在するためE2E化した。
 * 表示文言のうち i18n リソース(messages.ja.yaml)由来の語はオラクルにせず、設計書が明記する文言・観測挙動で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m06/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 * 検索結果を要するケースは SEED-M07-01-PURCHASE（ネット買取注文レコード）が前提。未投入時は test.skip/test.fixme でガード。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OnlinePurchasePurchaseOnlineSearchListPage } from "../../../pages/admin/m07/m07_01_admin_online_purchase_purchase_online_search_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// SEED-M07-01-PURCHASE: 検索ヒットするネット買取注文の既知レコード（買取番号＝整数 b.id）。未設定なら検索結果ケースをガード。
const PURCHASE_NUMBER = process.env.PURCHASE_NUMBER || "";
const HAS_SEED = HAS_CREDS && !!PURCHASE_NUMBER;

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/purchase/list(\\?|$)`);
// 検索結果は同一テンプレートで描画される（POST /purchase/search）。
const SEARCH_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/purchase/search(\\?|$)`);
// 詳細(編集)は admin_purchase_edit = /{admin_route}/purchase/{id}/edit（id は \d+。Controller:199）。
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/purchase/\\d+/edit(\\?|$)`);
// 表示件数/並び順リンクは admin_purchase_page = /{admin_route}/purchase/page/1?...（page_no=1 で再表示。index.twig:184,197-198）。
const PAGE_COUNT_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/purchase/page/1\\?(?=[^#]*\\bpage_count=\\d+\\b)`
);
const SORT_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/purchase/page/1\\?(?=[^#]*\\bsort=)(?=[^#]*\\border=(ASC|DESC)\\b)`
);

// 設計書が明記する表示文言（仕様由来＝オラクル）。実装に合わせて変えない。
const NO_RESULT_MSG = "検索条件に該当するデータがありませんでした。"; // 仕様「エッジケース」/ index.twig:305
const RESULT_COUNT_PREFIX = "検索結果"; // 仕様「集計条件」＝件数見出し（admin.common.search_result）

// 買取番号は b.id への等号一致（数値解釈）。確実に0件にするため巨大値を使う（整数上限近傍）。
const NO_MATCH_NUMBER = "2147483647";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 > ネット買取管理 > 買取検索一覧",
  { tag: ["@admin", "@search", "@purchase"] },
  () => {
    // ===== 認証ガード（資格情報不要・非破壊） =====

    test("E2E-M07-01-040 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/list`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示（ログインのみ・seed不要） =====

    test("E2E-M07-01-001 初期表示で検索パネルの主要入力項目が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await expect(page).toHaveURL(LIST_RE);
      await list.seeSearchPanel();
    });

    test("E2E-M07-01-002 初期表示でAND/OR・本人確認・利用回数・棚戻しの入力項目が存在する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.seeSecondaryInputs();
    });

    test("E2E-M07-01-003 初期表示で買取依頼日(開始)に既定の日付が設定される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      // 仕様「入力項目」: request_date_from のみ eccube_default_from_term(-3month相当) の既定値が入る。
      // オラクルは仕様（過去日付＝現在より前の有効な日付）由来。実装の正確なオフセット値は固定しない。
      const fromValue = await list.requestDateFrom.inputValue();
      expect(fromValue, "既定値が空でないこと").not.toBe("");
      const parsedFrom = new Date(fromValue.replace(/\//g, "-"));
      expect(
        Number.isNaN(parsedFrom.getTime()),
        "既定値が日付として解釈できること"
      ).toBe(false);
      expect(
        parsedFrom.getTime(),
        "既定値が現在日より過去（-3month相当の既定）であること"
      ).toBeLessThan(Date.now());
      // 要確認: -3month の厳密値（eccube_default_from_term の設定値）は実機で確認する。
    });

    test("E2E-M07-01-004 初期表示(GET)では結果一覧ブロックが描画されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      // 仕様「初期GET」: 一覧・件数見出し・ページングは出さない（pagination 無し）。
      await expect(list.resultBlock).toHaveCount(0);
      await expect(list.countHeading).toHaveCount(0);
    });

    test("E2E-M07-01-005 初期表示で検索ボタンと検索条件クリアボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await expect(list.searchButton).toBeVisible();
      await expect(list.clearButton).toBeVisible();
    });

    test("E2E-M07-01-006 検索フォームにCSRFトークンが出力されない（CSRF無効化）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      // 仕様「フロント挙動(一覧のCSRF)」: 検索フォームはCSRF無効化＝トークン隠し項目を出力しない。
      // オラクルは「トークン項目が無い」こと。トークン名や値はオラクル化しない。
      await expect(list.searchFormCsrfTokens).toHaveCount(0);
    });

    // ===== 検索 0件（ログインのみ・該当しない条件で誘発） =====

    test("E2E-M07-01-010 該当しない買取番号で0件メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(NO_MATCH_NUMBER);
      await expect(page).toHaveURL(SEARCH_RE);
      await expect(page.locator("body")).toContainText(NO_RESULT_MSG);
    });

    test("E2E-M07-01-011 検索実行で件数見出し(検索結果：N件)が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(NO_MATCH_NUMBER);
      // 仕様「集計条件」: 検索後は総件数の見出しを出す（pagination 真）。
      await expect(list.countHeading).toContainText(RESULT_COUNT_PREFIX);
    });

    test("E2E-M07-01-012 検索結果0件時はCSVダウンロード/表示件数プルダウンが出ない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(NO_MATCH_NUMBER);
      // 仕様「フロント挙動／エッジケース」: 0件時はダウンロードUI・件数メニューが出ない（totalItemCount>0 のみ描画）。
      await expect(list.csvMenu).toHaveCount(0);
      await expect(list.pageCountPulldown).toHaveCount(0);
    });

    // ===== バリデーション（買取番号 文字列長。ログインのみ） =====

    test("E2E-M07-01-013 買取番号に最大長(255)を入力しても検証エラーにならず検索される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber("9".repeat(255)); // 仕様「バリデーション」: 上限 eccube_stext_len=255（境界内）
      await expect(page).toHaveURL(SEARCH_RE); // 検索が実行される（0件でも検索結果画面に到達）
      await expect(list.countHeading).toContainText(RESULT_COUNT_PREFIX);
    });

    // ===== 検索ヒット（SEED-M07-01-PURCHASE が必要） =====

    test("E2E-M07-01-020 買取番号一致で結果ブロック・結果テーブルが表示される", async ({ page }) => {
      test.skip(!HAS_SEED, "SEED-M07-01-PURCHASE 未設定（PURCHASE_NUMBER）");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(PURCHASE_NUMBER);
      await expect(list.resultBlock).toBeVisible();
      await expect(list.resultTable.first()).toBeVisible();
      await expect(list.countHeading).toContainText(RESULT_COUNT_PREFIX);
      // 仕様「業務ルール(買取番号 b.id 等号一致)」「IT-15 対象データ」: 検索した買取番号の行が結果に含まれること。
      // これが無いと検索条件が効かず別レコードが出ても通るため、対象データ性を明示検証する（オラクルは仕様由来）。
      await expect(
        list.purchaseNumberLinks.filter({ hasText: PURCHASE_NUMBER }).first()
      ).toBeVisible();
    });

    test("E2E-M07-01-021 結果テーブルの見出しが仕様の列で表示される", async ({ page }) => {
      test.skip(!HAS_SEED, "SEED-M07-01-PURCHASE 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(PURCHASE_NUMBER);
      await list.seeResultTableHeaders();
    });

    test("E2E-M07-01-022 買取番号リンク押下でネット買取編集(詳細)へ遷移する", async ({ page }) => {
      test.skip(!HAS_SEED, "SEED-M07-01-PURCHASE 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(PURCHASE_NUMBER);
      await list.purchaseNumberLinks.first().click();
      await expect(page).toHaveURL(EDIT_RE); // 仕様「画面遷移」: admin_purchase_edit /purchase/{id}/edit
    });

    test("E2E-M07-01-023 検索結果あり時に表示件数プルダウン・CSVダウンロードDDが表示される", async ({ page }) => {
      test.skip(!HAS_SEED, "SEED-M07-01-PURCHASE 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(PURCHASE_NUMBER);
      await expect(list.pageCountPulldown).toBeVisible();
      await expect(list.csvMenu).toBeVisible();
    });

    test("E2E-M07-01-024 結果行メニューに編集・削除・メール通知リンクが表示される", async ({ page }) => {
      test.skip(!HAS_SEED, "SEED-M07-01-PURCHASE 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(PURCHASE_NUMBER);
      // 仕様「フロント挙動(表示要素：行メニュー（編集・削除リンク等）)」。削除実行/メール送信本体は別機能。
      // 行メニューはBootstrapドロップダウンで既定折りたたみのため、可視ではなくDOM存在で判定する。
      await expect(list.rowMenuEditLinks.first()).toBeAttached();
      await expect(list.rowMenuDeleteLinks.first()).toBeAttached();
      await expect(list.rowMenuMailLinks.first()).toBeAttached();
    });

    test("E2E-M07-01-030 表示件数変更で page/1?page_count 付きURLへ再表示される", async ({ page }) => {
      test.skip(!HAS_SEED, "SEED-M07-01-PURCHASE 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(PURCHASE_NUMBER);
      // option[value] には path('admin_purchase_page', {page_no:1, page_count}) が入る（index.twig:184）。
      const targetUrl = await list.pageCountPulldown
        .locator("option[value*='page_count=']")
        .first()
        .getAttribute("value");
      expect(targetUrl, "表示件数optionに admin_purchase_page URLが設定されること").toBeTruthy();
      await page.goto(targetUrl as string); // onchange の window.location.href 遷移相当（index.twig:28-33）
      await expect(page).toHaveURL(PAGE_COUNT_RE); // 仕様「利用者視点の入口」: page_no=1 で再表示
    });

    test("E2E-M07-01-031 並び順サブメニューの昇順/降順リンクが page/1?sort&order を指す", async ({ page }) => {
      test.skip(!HAS_SEED, "SEED-M07-01-PURCHASE 未設定");
      await login(page);
      const list = new OnlinePurchasePurchaseOnlineSearchListPage(page);
      await list.goto();
      await list.searchByPurchaseNumber(PURCHASE_NUMBER);
      const href = await list.sortMenu
        .locator("a[href*='order=ASC'], a[href*='order=DESC']")
        .first()
        .getAttribute("href");
      expect(href, "並び順リンクに admin_purchase_page sort/order が設定されること").toMatch(SORT_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M07-01-014 買取番号に最大長+1(256)を入力すると文字列長の検証エラーが表示される（要実機: form_errors のエラー要素セレクタ確認）",
      async () => {
        // 期待は仕様「バリデーション」(買取番号 Length max eccube_stext_len)由来。256桁でエラー表示・検索が完了しないこと。
        // form_errors(purchase_number)(index.twig:58) のエラー要素セレクタ(.invalid-feedback 等)を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M07-01-050 並び順パラメータが ASC/DESC 以外のとき admin.error.sort のフラッシュで初期一覧相当に戻る（要: 直前検索セッション＋不正order投入経路）",
      async () => {
        // 期待は仕様「エラー処理／エッジケース」(フラッシュ admin.error.sort・一覧カード無し)由来。
        // /purchase/page/1?sort=...&order=INVALID は直前のPOST検索セッションを前提とするため、その確立後に実装する。
      }
    );

    test.fixme(
      "E2E-M07-01-051 ページ繰り(GET /purchase/page/{n})で直前検索条件をセッション復元して表示（要: 複数ページ分のSEED-M07-01-PURCHASE）",
      async () => {
        // 期待は仕様「処理フロー(GETでのページ繰り)」由来。2ページ以上ヒットする検索条件を投入後に実装する。
      }
    );

    test.fixme(
      "E2E-M07-01-052 注文者名リンク押下で買取状況を空にし氏名で再検索される（要実機: select2解除＋JS自動submit挙動 / 要SEED）",
      async () => {
        // 期待は仕様「フロント挙動／エッジケース(氏名自動検索)」由来。purchase.js の post_name クリック挙動を実機確認後に実装する。
      }
    );

    test.fixme(
      "E2E-M07-01-053 検索条件クリアボタンで買取状況(select2)のみ空になる（要実機: select2クリア挙動の確認）",
      async () => {
        // 期待は仕様「フロント挙動(検索条件をクリア)」由来＝買取状況のみ select2 で空、他項目・日付はクライアントで消さない。
      }
    );
  }
);
