/**
 * 管理画面 商品管理 商品検索・一覧 E2E。納品ケース表
 * integration_test/e2e/m03_01_admin_product_product_search_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、データ十分性やセッション復元など要実機確認は test.fixme で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m03-01_admin_product_product_search_list.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSearchListPage } from "../../../pages/admin/m03/m03_01_admin_product_product_search_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;
const EDIT_RE = /\/product\/product\/\d+\/edit(\?|$)/;
// 表示件数変更後の遷移先（処理フロー#3・入口節 GET /product/page/1?page_count=…）。
const PAGE_COUNT_RE = /\/product\/page\/1\?.*page_count=/;
// SEED-M03-01-PRODUCT が商品名に含む既知語。シード実装時に確定（要確認）。
const SEED_PRODUCT_NAME_KEYWORD =
  process.env.SEED_M03_01_PRODUCT_NAME_KEYWORD || "テスト商品";

/** 管理ログインして商品一覧を開く。 */
async function loginAndOpenList(page: Page): Promise<ProductProductSearchListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const list = new ProductProductSearchListPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > 商品管理 > 商品検索・一覧",
  { tag: ["@admin", "@product"] },
  () => {
    // ===== 認証不要 =====

    test("E2E-M03-01-060 未ログインで /product 直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示（ログインのみ） =====

    test("E2E-M03-01-001 初期表示: 見出し「商品一覧」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpenList(page);
      await expect(page.locator("body")).toContainText("商品一覧"); // trans admin.product.product_list
    });

    test("E2E-M03-01-002 初期表示: 検索フォーム（商品名欄・検索ボタン）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.seeSearchForm();
    });

    test("E2E-M03-01-003 初期表示: 詳細検索枠が初期で開いている", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await expect(list.searchDetail).toBeVisible(); // index.twig:231 collapse show
    });

    test("E2E-M03-01-004 検索条件クリアで入力欄が空に戻る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(フロント挙動 JS: .search-clear で #search_form 内の入力をクリア)。
      await list.productName.fill("クリア対象キーワード");
      await expect(list.productName).toHaveValue("クリア対象キーワード");
      await list.searchClear.click();
      await expect(list.productName).toHaveValue(""); // クリア後は空
    });

    test("E2E-M03-01-005 詳細検索枠の開閉ボタンで aria-expanded が切り替わる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(フロント挙動 JS: collapse 表示時にボタンの aria-expanded を更新)。初期は開(true)。
      await expect(list.searchDetailToggle).toHaveAttribute("aria-expanded", "true");
      await list.searchDetailToggle.click();
      await expect(list.searchDetailToggle).toHaveAttribute("aria-expanded", "false");
    });

    test("E2E-M03-01-011 検索実行後に件数見出し（検索結果）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 実装の初期GETは pagination=null で件数見出しを描画しない（不具合候補#7）。
      // 件数見出しは検索実行（処理フロー#5）後に表示されるため、既定条件で検索してから観測する。
      await list.submitSearch();
      await list.seeResultCountHeading(); // trans admin.common.search_result（pagination有時）
    });

    // ===== 検索POST（正常系/異常系の対） =====

    test("E2E-M03-01-010 商品名で検索すると検索結果（件数見出し）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // SEED-M03-01-PRODUCT が含む既知語で部分一致検索し、検索が実行され件数見出しが返ることを確認する。
      await list.searchByProductName(SEED_PRODUCT_NAME_KEYWORD);
      await list.seeResultCountHeading();
    });

    test("E2E-M03-01-012 該当しない条件で検索すると0件メッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByProductName("__no_such_product_zzz_明らかに存在しない__");
      await list.seeNoResult(); // trans admin.common.search_no_result
    });

    test("E2E-M03-01-020 規格更新日が終了<開始でPOST検証エラーメッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様: 終了が開始より前ならフォームエラー（バリデーション節・エッジケース POST検証エラー）。
      await list.searchByUpdateDateRange("2025-12-31", "2025-01-01");
      await list.seeInvalidCondition(); // trans admin.common.search_invalid_condition
    });

    test("E2E-M03-01-021 POST検証エラー時は一覧テーブルを表示しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByUpdateDateRange("2025-12-31", "2025-01-01");
      await list.seeInvalidCondition();
      // 仕様(エラー処理): エラー時は一覧テーブル(#form_bulk)を出さない。
      await expect(page.locator("#form_bulk")).toHaveCount(0);
    });

    test("E2E-M03-01-022 販売価格に桁上限超過を入力するとPOST検証エラーになる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(バリデーション節: 金額系 Symfony 桁上限)。上限値(eccube_price_len)は実装由来のため
      // オラクル化せず、明らかに桁数の多い数値で検証エラー文言のみを観測する。
      await list.searchBySellPriceFrom("9".repeat(30));
      await list.seeInvalidCondition(); // trans admin.common.search_invalid_condition
    });

    test("E2E-M03-01-023 規格更新日が開始<=終了（正常）では検証エラーにならない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(バリデーション節 正常系・020の対): 開始<=終了の妥当レンジでは相関エラーを出さない。
      await list.searchByUpdateDateRange("2025-01-01", "2025-12-31");
      await list.seeNoInvalidCondition(); // 「検索条件に誤りがあります」を表示しない
    });

    test("E2E-M03-01-013 POST検証エラー後もフォームに入力値が保持される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(入出力 失敗時出力: フォームエラー時はエラーメッセージと入力値を保持したフォーム)。
      await list.searchByUpdateDateRange("2025-12-31", "2025-01-01");
      await list.seeInvalidCondition();
      await expect(list.updateDateFrom).toHaveValue("2025-12-31"); // 入力値保持
    });

    test("E2E-M03-01-024 販売価格が桁上限内（正常境界）では検証エラーにならない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(バリデーション節 金額系 正常系・022の対): 上限内の数値では桁上限エラーを出さない。
      // 上限値(eccube_price_len)は実装由来のためオラクル化せず、明らかに上限内の数値で観測する。
      await list.searchBySellPriceFrom("100");
      await list.seeNoInvalidCondition();
    });

    // ===== 一覧操作（データ依存はガード） =====

    test("E2E-M03-01-031 表示件数プルダウン変更で件数指定URLへ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 表示件数プルダウンは pagination 有時のみ描画されるため、まず検索を実行する（不具合候補#7）。
      await list.submitSearch();
      const count = await list.pageCountPulldown.count();
      test.skip(count === 0, "検索結果が無く表示件数プルダウンが描画されない（要シード）");
      // 仕様: page_count を含むURL(/product/page/1?page_count=…)へ遷移し、その件数で分割する。
      const options = await list.pageCountPulldown.locator("option").all();
      test.skip(
        options.length < 2,
        "表示件数の選択肢が1件のみで別の値へ変更できない（要 mtb_page_max 複数値）"
      );
      const target = await options[options.length - 1].getAttribute("value");
      await list.pageCountPulldown.selectOption({ index: options.length - 1 });
      await expect(page).toHaveURL(PAGE_COUNT_RE);
      expect(target).toContain("page_count=");
    });

    test("E2E-M03-01-050 商品名リンク押下で商品編集画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 商品名リンクは pagination 有時の一覧にのみ描画されるため、まず検索を実行する（不具合候補#7）。
      await list.submitSearch();
      const linkCount = await list.firstProductLink.count();
      test.skip(linkCount === 0, "一覧に商品が無く商品名リンクが描画されない（要シード）");
      await list.firstProductLink.click();
      await expect(page).toHaveURL(EDIT_RE); // 画面遷移: 商品編集へ
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-01-030 ページネーションでNページ表示（要: 2ページ以上のデータ）",
      async () => {
        // 期待は仕様(利用者視点の入口 admin_product_page)由来。十分な件数のシード投入後に実装。
      }
    );

    test.fixme(
      "E2E-M03-01-032 一覧表示データモード変更で再描画（要: 一覧データ＋display_mode観測手順の実機確認）",
      async () => {
        // 期待は仕様(処理フロー#4 display_mode)由来。#display_pulldown 変更後の表示差分を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-01-040 ソートアイコン押下でソート反映・ページ1リセット（要: 一覧データ＋並び順の安定観測）",
      async () => {
        // 期待は仕様(ソート時の判定順序)由来。.js-listSort クリック→POST・page_no=1 を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-01-051 resume=1 で戻ると保存済みページ番号・検索条件で一覧復元（要: セッション状態の事前確立）",
      async () => {
        // 期待は仕様(遷移時に引き継ぐ状態 resume=1)由来。検索→別画面→/product?resume=1 の手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-01-070 ホーム在庫切れ導線 search_nonstock→/product/page/1 へリダイレクト（要: 在庫切れ商品のシード）",
      async () => {
        // 期待は仕様(処理フロー admin_homepage_nonstock)由来。/search_nonstock からのリダイレクトを実機確認後に実装。
      }
    );
  }
);
