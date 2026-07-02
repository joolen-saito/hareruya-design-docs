/**
 * 管理画面 商品管理「商品規格一覧」E2E。
 * 納品ケース表 integration_test/e2e/m03_08_admin_product_product_product_class_list_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。値依存（特定の規格状態を持つ商品）ケースも実装し、
 * 専用シードID（env）が未設定なら test.skip（理由付き）で安全に飛ばす。手動/間接・対象外はケース表で全量管理。
 * 期待結果は仕様(functions/pf-eccube3/m03-08_admin_product_product_product_class_list.md ＋ 観点表 ＋ messages.ja.yaml)
 * 由来（オラクル独立性）。実装の現挙動・Form制約を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 当画面へ到達できる管理者（2FA等無効の共通アカウント前提）
 *  - PCLASS_PRODUCT_ID  : アクティブ規格を1件以上持つ商品ID（SEED-M03-08-ACTIVE）
 *  - PCLASS_MISSING_ID  : 未登録/不正な商品ID（404確認用。既定は極大値）
 *  - PCLASS_UNLIMITED_ID: stock_unlimited=true の規格を持つ商品ID（SEED-M03-08-UNLIMITED）
 *  - PCLASS_ABOLISHED_ID: 廃止公開状態の規格を含む商品ID（SEED-M03-08-ABOLISHED）
 *  - PCLASS_EMPTY_ID    : 規格が1件もヒットしない商品ID（SEED-M03-08-EMPTY）
 *  - PCLASS_SALE_LIMIT_EMPTY_ID : 先頭アクティブ行の sale_limit が偽評価の商品ID
 *  - PCLASS_CODE_EMPTY_ID  : 先頭アクティブ行の商品コードが偽評価の商品ID（SEED-M03-08-CODE_EMPTY）
 *  - PCLASS_PRICE_EMPTY_ID : 先頭アクティブ行の各価格が偽評価の商品ID（SEED-M03-08-PRICE_EMPTY）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductProductClassListPage } from "../../../pages/admin/m03/m03_08_admin_product_product_product_class_list.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const PRODUCT_ID = process.env.PCLASS_PRODUCT_ID || "";
const MISSING_ID = process.env.PCLASS_MISSING_ID || "99999999";
// 値依存ケース（特定の規格状態を持つ商品）のシードID。未設定なら当該テストは test.skip。
const UNLIMITED_ID = process.env.PCLASS_UNLIMITED_ID || ""; // SEED-M03-08-UNLIMITED
const ABOLISHED_ID = process.env.PCLASS_ABOLISHED_ID || ""; // SEED-M03-08-ABOLISHED
const EMPTY_ID = process.env.PCLASS_EMPTY_ID || ""; // SEED-M03-08-EMPTY
const SALE_LIMIT_EMPTY_ID = process.env.PCLASS_SALE_LIMIT_EMPTY_ID || ""; // 先頭アクティブ行の sale_limit が偽評価の商品
const CODE_EMPTY_ID = process.env.PCLASS_CODE_EMPTY_ID || ""; // SEED-M03-08-CODE_EMPTY（商品コード偽評価）
const PRICE_EMPTY_ID = process.env.PCLASS_PRICE_EMPTY_ID || ""; // SEED-M03-08-PRICE_EMPTY（価格偽評価）
const HAS_PRODUCT = HAS_CREDS && !!PRODUCT_ID;

// URLアサーションは管理ルート（ECCUBE_ADMIN_ROUTE）配下であることまで含めて検証する（同形URL誤判定を防ぐ）。
const R = ECCUBE_ADMIN_ROUTE;
const HOME_RE = new RegExp(`/${R}/?(\\?|$)`);
const LOGIN_RE = new RegExp(`/${R}/login(\\?|$)`);
const NEW_RE = new RegExp(`/${R}/product/product/class/\\d+/new(\\?|$)`);
const EDIT_RE = new RegExp(`/${R}/product/product/class/\\d+/edit/\\d+(\\?|$)`);
const PRODUCT_EDIT_RE = new RegExp(`/${R}/product/product/edit/\\d+(\\?|$)`);
const PRODUCT_LIST_RESUME_RE = new RegExp(`/${R}/product(\\?|.*[?&])resume=1`);

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe("管理画面 > 商品管理 > 商品規格一覧", { tag: ["@admin", "@product"] }, () => {
  // ===== 認証不要・非破壊 =====

  test("E2E-M03-08-022 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    // 仕様(アクセス可否): 未ログインは一覧本文に到達せず共通ログインに委ねられる。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product/class/${PRODUCT_ID || 1}`);
    await expect(page.locator("#login_id")).toBeVisible();
    await expect(page).toHaveURL(LOGIN_RE);
  });

  // ===== 一覧表示（SEED-M03-08-ACTIVE：アクティブ規格を1件以上持つ商品） =====

  test("E2E-M03-08-001 一覧画面にタイトル「商品規格一覧」が表示される", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定（ECCUBE_ADMIN_USER/PASS, PCLASS_PRODUCT_ID）");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID);
    await expect(page).toHaveTitle(/商品規格一覧/); // 仕様: window title = admin.product.product_class_list
  });

  test("E2E-M03-08-002 ヘッダカードに商品名が表示される", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID);
    await expect(list.productNameHeader).toBeVisible();
    await expect(list.productNameHeader).not.toBeEmpty(); // 商品名（{{ Product.name }}）が出ること
  });

  test("E2E-M03-08-003 検索結果件数ヘッダ「検索結果：…」が表示される", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID);
    await expect(list.searchResultLabel).toBeVisible(); // 仕様: admin.common.search_result「検索結果：%count%件が該当しました」
  });

  test("E2E-M03-08-004 アクティブ一覧の列見出しが仕様どおり表示される", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID);
    await list.seeActiveHeaders(); // 公開状態/言語/状態/スマレジ連携フラグ/商品コード/在庫数/販売制限数/基準価格/販売価格/買取価格
  });

  test("E2E-M03-08-005 廃止規格一覧ブロック見出し表示・折りたたみ開閉ができる", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID);
    await expect(list.abolishedHeading).toBeVisible(); // 「廃止規格一覧」見出し
    await expect(list.abolishedBlock).not.toBeVisible(); // 既定は折りたたみ（collapse）
    await list.abolishedToggle.click();
    await expect(list.abolishedBlock).toBeVisible(); // トグルで展開（Bootstrap collapse のみ）
  });

  test("E2E-M03-08-006 廃止規格一覧テーブルの列見出しが仕様どおり（公開状態・スマレジ・編集列を省略）", async ({
    page,
  }) => {
    test.skip(!HAS_CREDS || !ABOLISHED_ID, "SEED-M03-08-ABOLISHED 未設定（PCLASS_ABOLISHED_ID）");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(ABOLISHED_ID);
    await list.abolishedToggle.click();
    await expect(list.abolishedBlock).toBeVisible();
    // 仕様(フロント挙動): 廃止表は言語/状態/商品コード/在庫数/販売制限数/各価格のみで、公開状態・スマレジ・編集列を持たない。
    await list.seeAbolishedHeaders();
  });

  // ===== 遷移 =====

  test("E2E-M03-08-010 「新規登録」ボタン押下で規格新規入力(/new)へ遷移", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID);
    await list.newButton.click();
    await expect(page).toHaveURL(NEW_RE); // 仕様(画面遷移): …/product/product/class/{id}/new
  });

  test("E2E-M03-08-011 行「編集」押下で規格編集(/edit/{productClassId})へ遷移", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID);
    await list.editButtons.first().click();
    await expect(page).toHaveURL(EDIT_RE); // 仕様(画面遷移): …/product/product/class/{id}/edit/{productClassId}
  });

  test("E2E-M03-08-012 フッタ戻り(return_product_list未指定)が商品編集へ向く", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID); // return_product_list なし
    await expect(list.footerBackLink).toHaveAttribute("href", PRODUCT_EDIT_RE); // 仕様: …/product/product/edit/{id}
  });

  test("E2E-M03-08-013 return_product_list=1付与でフッタ戻りが商品一覧(resume=1)へ向く", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID, true); // ?return_product_list=1
    await expect(list.footerBackLink).toHaveAttribute("href", PRODUCT_LIST_RESUME_RE); // 仕様: /product?resume=1
  });

  // ===== HTTP応答 =====

  test("E2E-M03-08-020 存在しない商品IDで404となる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    const res = await page.goto(list.listUrl(MISSING_ID));
    expect(res?.status()).toBe(404); // 仕様(エラー処理): 商品ID解決不可→HTTP 404
  });

  test("E2E-M03-08-021 一覧URLへPOSTしても一覧描画のみで内容が変わらない", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    // 仕様(利用者視点の入口/副作用): 一覧URLへのPOSTは一覧組み立てのみで送信ボディを解釈しない。
    const res = await list.postList(PRODUCT_ID);
    expect(res.ok()).toBeTruthy(); // 2xx で一覧が返ること（フォーム処理は無い）
    // POST応答も GET と同じ一覧本文（タイトル相当・件数ヘッダ）を返し、副作用メッセージが無いこと。
    const body = await res.text();
    expect(body).toMatch(/商品規格一覧/);
    expect(body).toMatch(/検索結果/);
    // 再表示しても件数（=アクティブ集合長）が変わらない＝送信ボディで内容が変化しないこと。
    const before = await (async () => {
      await list.gotoList(PRODUCT_ID);
      return list.searchResultCount();
    })();
    await list.postList(PRODUCT_ID);
    await list.gotoList(PRODUCT_ID);
    expect(await list.searchResultCount()).toBe(before);
  });

  // ===== 値依存（要シード）。専用シードIDが env 未設定なら test.skip（抜け漏れは付帯表で全量管理） =====

  test("E2E-M03-08-030 在庫数が無制限の規格行で「無制限」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS || !UNLIMITED_ID, "SEED-M03-08-UNLIMITED 未設定（PCLASS_UNLIMITED_ID）");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(UNLIMITED_ID);
    // 仕様(一覧表示の列と値): stock_unlimited 真の行の在庫数セルに admin.product.stock_unlimited__short「無制限」。
    expect(await list.unlimitedStockCells.count()).toBeGreaterThan(0);
  });

  test("E2E-M03-08-031 廃止公開状態の規格はアクティブ一覧に出ず廃止一覧に出る", async ({ page }) => {
    test.skip(!HAS_CREDS || !ABOLISHED_ID, "SEED-M03-08-ABOLISHED 未設定（PCLASS_ABOLISHED_ID）");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(ABOLISHED_ID);
    await list.abolishedToggle.click();
    await expect(list.abolishedBlock).toBeVisible();
    // 仕様(集計条件/データ整合性): 公開状態が廃止の規格は廃止一覧にのみ現れ、アクティブ一覧の公開状態セルには現れない。
    expect(await list.abolishedRows.count()).toBeGreaterThan(0);
    const n = await list.activeRows.count();
    for (let i = 0; i < n; i++) {
      const statusCell = list.activeCell(
        list.activeRows.nth(i),
        ProductProductProductClassListPage.COL.displayStatus
      );
      await expect(statusCell).not.toHaveText(/廃止/);
    }
  });

  test("E2E-M03-08-032 件数ヘッダの個数がアクティブ集合の要素数と一致する", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID);
    // 仕様(集計条件): 「検索結果」件数＝アクティブ集合長＝アクティブ一覧の表示行数。
    expect(await list.searchResultCount()).toBe(await list.activeRows.count());
  });

  test("E2E-M03-08-033 規格0件の商品で件数0・空テーブルとなる", async ({ page }) => {
    test.skip(!HAS_CREDS || !EMPTY_ID, "SEED-M03-08-EMPTY 未設定（PCLASS_EMPTY_ID）");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(EMPTY_ID);
    // 仕様(エラー処理): 1件もヒットしない→件数0・アクティブ/廃止とも空tbody。
    expect(await list.searchResultCount()).toBe(0);
    expect(await list.activeRows.count()).toBe(0);
    expect(await list.abolishedRows.count()).toBe(0);
  });

  test("E2E-M03-08-034 販売制限数が偽評価の規格行は空セルとなる", async ({ page }) => {
    test.skip(
      !HAS_CREDS || !SALE_LIMIT_EMPTY_ID,
      "SEED(先頭アクティブ行の sale_limit 偽評価) 未設定（PCLASS_SALE_LIMIT_EMPTY_ID）"
    );
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(SALE_LIMIT_EMPTY_ID);
    // 仕様(一覧表示の列と値): 販売制限数は Twig 偽評価のとき空文字。
    const cell = list.activeCell(
      list.activeRows.first(),
      ProductProductProductClassListPage.COL.saleLimit
    );
    await expect(cell).toHaveText(/^\s*$/);
  });

  test("E2E-M03-08-035 スマレジ連携フラグ列が真→ON／偽→OFFの字面で表示される", async ({ page }) => {
    test.skip(!HAS_PRODUCT, "SEED-M03-08-ACTIVE 未設定");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRODUCT_ID);
    // 仕様(一覧表示の列と値): スマレジ連携フラグは真→「ON」/偽→「OFF」（設計書 md:93 で字面固定）。
    const n = await list.activeRows.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const cell = list.activeCell(
        list.activeRows.nth(i),
        ProductProductProductClassListPage.COL.smaregi
      );
      await expect(cell).toHaveText(/^(ON|OFF)$/);
    }
  });

  test("E2E-M03-08-036 商品コード未設定の規格行は商品コードセルが空表示", async ({ page }) => {
    test.skip(!HAS_CREDS || !CODE_EMPTY_ID, "SEED-M03-08-CODE_EMPTY 未設定（PCLASS_CODE_EMPTY_ID）");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(CODE_EMPTY_ID);
    // 仕様(一覧表示の列と値): 商品コードが偽評価（未設定/空）の行は当該セルが空文字。
    const cell = list.activeCell(
      list.activeRows.first(),
      ProductProductProductClassListPage.COL.productCode
    );
    await expect(cell).toHaveText(/^\s*$/);
  });

  test("E2E-M03-08-037 各価格が偽評価の規格行は基準/販売/買取価格セルが空表示", async ({ page }) => {
    test.skip(!HAS_CREDS || !PRICE_EMPTY_ID, "SEED-M03-08-PRICE_EMPTY 未設定（PCLASS_PRICE_EMPTY_ID）");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(PRICE_EMPTY_ID);
    // 仕様(一覧表示の列と値): 価格が偽評価（未設定/0）の行は基準/販売/買取価格セルが空文字。
    const row = list.activeRows.first();
    for (const col of [
      ProductProductProductClassListPage.COL.standardPrice,
      ProductProductProductClassListPage.COL.salePrice,
      ProductProductProductClassListPage.COL.buyPrice,
    ]) {
      await expect(list.activeCell(row, col)).toHaveText(/^\s*$/);
    }
  });

  test("E2E-M03-08-038 同一規格がアクティブ一覧と廃止一覧に二重掲載されない", async ({ page }) => {
    test.skip(!HAS_CREDS || !ABOLISHED_ID, "SEED-M03-08-ABOLISHED 未設定（PCLASS_ABOLISHED_ID）");
    await loginToHome(page);
    const list = new ProductProductProductClassListPage(page);
    await list.gotoList(ABOLISHED_ID);
    await list.abolishedToggle.click();
    await expect(list.abolishedBlock).toBeVisible();
    // 仕様(データ整合性): 各行は公開状態=廃止か否かで一方のみに載り、同一productClassIdが両表に重複しない。
    const activeIds = await list.rowIds(list.activeRows);
    const abolishedIds = await list.rowIds(list.abolishedRows);
    const intersection = activeIds.filter((id) => abolishedIds.includes(id));
    expect(intersection).toEqual([]);
  });
});
