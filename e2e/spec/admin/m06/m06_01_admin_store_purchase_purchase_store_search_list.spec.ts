/**
 * 管理画面 店頭買取管理 買取検索一覧（M06-01）E2E。納品ケース表
 * integration_test/e2e/m06_01_admin_store_purchase_purchase_store_search_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要データ十分性・要実機確認は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来設計だが、刷新先 ec-cube-enterprise に同一画面(admin_otcbuyorder)が実在するためE2E化した。
 * 表示文言のうち i18n リソース(messages/validators.ja.yaml)由来の語はオラクルにせず、設計書が明記する文言・観測挙動で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m05/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 * 検索結果を要するケースは SEED-M06-01-OTC（店頭買取受注レコード）が前提。未投入時は test.fixme/test.skip でガード。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchasePurchaseStoreSearchListPage } from "../../../pages/admin/m06/m06_01_admin_store_purchase_purchase_store_search_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// SEED-M06-01-OTC: 検索ヒットする店頭買取受注の既知レコード（査定ID）。未設定なら検索結果ケースをガード。
const OTC_ASSESSMENT_ID = process.env.OTC_ASSESSMENT_ID || "";
const HAS_SEED = HAS_CREDS && !!OTC_ASSESSMENT_ID;

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder(\\?|$)`);
// 詳細は admin_otcbuyorder_detail = /{admin_route}/otcbuyorder/{otcBuyOrderId}（otcBuyOrderId は \d+。
// OtcBuyOrderController.php:227-232）。/otcbuyorder/page/{n} は別ルートなので数字IDのみに限定する。
const DETAIL_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/\\d+(\\?|$)`);
// 表示件数リンクは path('admin_otcbuyorder', {pageno:1, page_count:N})＝?pageno=1&page_count=N（index.twig:176）。
// pageno=1 と page_count の双方を要求し、片方欠落で通らないようにする（パラメータ順非依存の先読み）。
const PAGE_COUNT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder\\?(?=[^#]*\\bpageno=1\\b)(?=[^#]*\\bpage_count=\\d+\\b)`);

// 設計書が明記する表示文言（仕様由来＝オラクル）。実装に合わせて変えない。
const NO_RESULT_MSG = "検索条件に該当するデータがありませんでした。"; // 仕様「エッジケース」/ index.twig:241

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe("管理画面 > 店頭買取管理 > 買取検索一覧", { tag: ["@admin", "@search", "@otcbuyorder"] }, () => {
  // ===== 認証ガード（資格情報不要・非破壊） =====

  test("E2E-M06-01-021 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 初期表示（ログインのみ・seed不要） =====

  test("E2E-M06-01-001 初期表示で検索パネルの各入力項目が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await expect(page).toHaveURL(LIST_RE);
    await list.seeSearchPanel();
  });

  test("E2E-M06-01-002 ステータス/買取店舗のプレースホルダが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    // placeholder は option[value=""] のテキスト（trans admin.purchase.store.form.status/shop.placeholder 由来）
    await expect(list.status.locator('option[value=""]')).toHaveText("ステータスを選択");
    await expect(list.shop.locator('option[value=""]')).toHaveText("店舗を選択");
  });

  test("E2E-M06-01-003 初期表示(GET)では結果一覧ブロックが描画されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    // 仕様「初期表示」: pagination が偽のため一覧ブロックは出ない。
    await expect(list.resultList).toHaveCount(0);
  });

  test("E2E-M06-01-004 ナビ「店頭買取管理」→「買取一覧」で一覧画面が開く", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    // 直接 goto で入口URL到達を確認（メニュー展開はUI構造依存のため要実機。入口の同一性は仕様「利用者視点の入口」由来）。
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await expect(page).toHaveURL(LIST_RE);
    await expect(list.searchButton).toBeVisible();
  });

  test("E2E-M06-01-005 初期表示で検索条件の初期値（棚戻しオフ・査定申込日時開始に初期値）が設定される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    // 仕様「入力項目」: 「棚戻し未完了のみ表示」初期値=オフ(md:150)。
    await expect(list.restockIncompleteOnly).not.toBeChecked();
    // 仕様「入力項目」: 査定申込日時(開始)初期値=前月1日(md:144)。書式は実装依存のため「空でない=初期値が設定済み」で判定する。
    await expect(list.applicationDateFrom).not.toHaveValue("");
  });

  // ===== 検索 0件（ログインのみ・該当しない条件で誘発） =====

  test("E2E-M06-01-013 該当しない査定IDで0件メッセージが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await list.searchByAssessmentId("E2E-NO-MATCH-" + Date.now()); // 完全一致で確実に0件
    await expect(page.locator(".box-title")).toContainText(NO_RESULT_MSG);
  });

  test("E2E-M06-01-015 検索結果0件時はCSVダウンロード/表示件数ブロックが出ない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await list.searchByAssessmentId("E2E-NO-MATCH-" + Date.now());
    // 仕様「エッジケース」: 0件時はCSVブロック・件数メニューが出ない。
    await expect(list.csvMenu).toHaveCount(0);
    await expect(list.pageMaxMenu).toHaveCount(0);
  });

  // ===== 検索ヒット（SEED-M06-01-OTC が必要） =====

  // ページャ(pager.twig)は pages.pageCount>1 のときのみ描画されるため、1件ヒットでは出ず本ケースのオラクルにしない。
  test("E2E-M06-01-010 検索実行で件数見出し・結果テーブルが表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M06-01-OTC 未設定（OTC_ASSESSMENT_ID）");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await list.searchByAssessmentId(OTC_ASSESSMENT_ID);
    await expect(list.resultList).toBeVisible(); // 一覧ブロック描画
    await expect(list.resultTable.first()).toBeVisible(); // テーブル
    await expect(page.locator(".box-title")).toContainText("検索結果"); // 件数見出し(仕様「集計条件」)
  });

  test("E2E-M06-01-011 結果テーブルの見出しが仕様の7列で表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M06-01-OTC 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await list.searchByAssessmentId(OTC_ASSESSMENT_ID);
    await list.seeResultTableHeaders();
  });

  test("E2E-M06-01-012 査定ID完全一致で該当受注が一覧に表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M06-01-OTC 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await list.searchByAssessmentId(OTC_ASSESSMENT_ID);
    await expect(list.resultTable.first()).toContainText(OTC_ASSESSMENT_ID); // 該当行が含まれる
  });

  test("E2E-M06-01-014 検索結果あり時に表示件数DD・CSVダウンロードDDが表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M06-01-OTC 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await list.searchByAssessmentId(OTC_ASSESSMENT_ID);
    await expect(list.pageMaxMenu).toBeVisible();
    await expect(list.csvMenu).toBeVisible();
  });

  test("E2E-M06-01-020 査定IDリンク押下で店頭買取詳細へ遷移する", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M06-01-OTC 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await list.searchByAssessmentId(OTC_ASSESSMENT_ID);
    await list.detailLinks.first().click();
    await expect(page).toHaveURL(DETAIL_RE); // 仕様「画面遷移」: admin_otcbuyorder_detail
  });

  test("E2E-M06-01-031 表示件数変更で pageno=1 付きURLで再表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M06-01-OTC 未設定");
    await login(page);
    const list = new StorePurchasePurchaseStoreSearchListPage(page);
    await list.goto();
    await list.searchByAssessmentId(OTC_ASSESSMENT_ID);
    // 表示件数メニュー内の件数リンク（path admin_otcbuyorder {pageno:1, page_count}）を押下。
    await list.pageMaxMenu.locator("a[href*='page_count=']").first().click();
    await expect(page).toHaveURL(PAGE_COUNT_RE); // 仕様「利用者視点の入口」: pageno=1 で再検索相当
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M06-01-030 ページ移動/パス形式ページングで直前検索条件をセッション復元（要: 複数ページ分のSEED-M06-01-OTC）",
    async () => {
      // 期待は仕様「処理フロー(ページ移動)」由来。2ページ以上ヒットする検索条件を投入後に実装。
    }
  );

  test.fixme(
    "E2E-M06-01-050 査定申込日時(開始)に最小日付未満で「不正な日付です。」が表示（要実機: datetimepicker入力経路）",
    async () => {
      // 期待は仕様「バリデーション」(Range min 0003-01-01 / form_error.out_of_range)由来。
      // single_text + datetimepicker のため範囲外値の確実な投入手順を実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M06-01-051 買取日時(開始)に最小日付未満で「不正な日付です。」が表示（要実機: datetimepicker入力経路）",
    async () => {
      // 期待は仕様「バリデーション」(complete_date_from も application_date_from と同一の Range min 0003-01-01 /
      // form_error.out_of_range)由来。異常系の対を application/complete 両側で確保する（片側欠落の解消）。
      // single_text + datetimepicker のため範囲外値の確実な投入手順を実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M06-01-052 査定申込日時(開始)に下限以上の有効日時を入れると日付エラーにならず検索が実行される（要実機: datetimepicker入力経路。050/051異常系の正常境界の対）",
    async () => {
      // 期待は仕様「バリデーション」(Range min 0003-01-01)由来。下限以上の有効日時では form_error.out_of_range が出ず検索が実行される。
      // single_text + datetimepicker のため有効値の確実な投入手順を実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M06-01-060 CSV出力でID未選択時にフラッシュエラー＋検索ページへリダイレクト（要実機: CSV DDのJS送信＋別エクスポートルート）",
    async () => {
      // 期待は仕様「エラー処理」(admin.purchase.online.csv_export.no_selection=「1つ以上の買取注文情報を選択してください。」)由来。
      // export_type を埋めて result_form を admin_otcbuyorder_export へ送信する経路。CSV出力本体は別機能のため最小確認に留める。
    }
  );
});
