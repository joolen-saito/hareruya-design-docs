/**
 * 管理画面 在庫管理 在庫分割結合検索/一覧 E2E。納品ケース表
 * integration_test/e2e/m04_12_admin_stock_stock_split_join_search_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要データ/要権限/要外部機能など自動化予定だが未実装のものは test.fixme で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-12_admin_stock_stock_split_join_search_list.md /
 * 基本設計(在庫管理機能) / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockSplitJoinSearchListPage } from "../../../pages/admin/m04/m04_12_admin_stock_stock_split_join_search_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;
const LIST_RE = /\/product\/stock\/split-join(\?|$)/;
// 結合新規へのリダイレクト先（admin_stock_join_new）。Controller.php:523。
const JOIN_NEW_RE = /\/product\/stock\/join\/new\b/;
// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const LIST_TITLE = "在庫分割結合一覧"; // :4578 admin.stock.split_join.list_title
const SEARCH_FIRST = "検索条件を入力し、検索ボタンをクリックしてください。"; // :4575 search_first
const NO_RESULT = "検索条件に合致するデータが見つかりませんでした"; // :1542 admin.common.search_no_result
const SOURCE_NOT_FOUND = "指定の在庫が見つかりません。"; // :4810 admin.stock.join.source_not_found

/** 管理ログインして在庫分割結合一覧を開く。 */
async function loginAndOpenList(
  page: Page
): Promise<StockStockSplitJoinSearchListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const list = new StockStockSplitJoinSearchListPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > 在庫管理 > 在庫分割結合検索・一覧",
  { tag: ["@admin", "@stock"] },
  () => {
    // ===== 認証不要（権限・認可） =====

    test("E2E-M04-12-060 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/split-join`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示・検索前状態 =====

    test("E2E-M04-12-001 初期表示: 見出し「在庫分割結合一覧」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpenList(page);
      await expect(page.locator("body")).toContainText(LIST_TITLE);
    });

    test("E2E-M04-12-002 検索前状態: 検索案内文言が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpenList(page);
      await expect(page.locator("body")).toContainText(SEARCH_FIRST); // stockSplitJoinSearchPerformed=false
    });

    test("E2E-M04-12-003 検索前状態: 件数見出しが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await expect(list.resultCount).toHaveCount(0); // GET初期は空一覧で件数見出しなし
    });

    test("E2E-M04-12-004 初期表示: 検索フォーム（商品名・商品コード・検索ボタン）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.seeSearchForm();
    });

    test("E2E-M04-12-008 分割CSV登録ボタンと結合CSV登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await expect(list.splitCsvRegisterButton).toBeVisible(); // 操作起点（M04-23モーダル入口）
      await expect(list.joinCsvRegisterButton).toBeVisible();
    });

    test("E2E-M04-12-009 分割CSV登録ボタン押下で分割CSV登録モーダルが開く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.openSplitCsvModal();
      await expect(list.splitCsvModal).toBeVisible(); // index.twig:420 #modalSplitCsv
    });

    test("E2E-M04-12-011 結合CSV登録ボタン押下で結合CSV登録モーダルが開く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.openJoinCsvModal();
      await expect(list.joinCsvModal).toBeVisible(); // index.twig:440 #modalJoinCsv（分割009と対）
    });

    test("E2E-M04-12-010 検索実行後に在庫分割結合CSV出力リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様: CSV出力は「検索結果に対する」出力（正本md:25,58）。検索実行後（stockSplitJoinSearchPerformed=true）のみ
      // リンクが表示される（index.twig:291）。初期表示では出ない＝検索実行を前提に確認する。
      await list.submitSearch();
      await expect(page).toHaveURL(LIST_RE);
      await expect(list.csvExportLink).toBeVisible(); // 入口（M04-14へ委譲）。出力内容は手動
    });

    // ===== 検索POST（正常×異常の対） =====

    test("E2E-M04-12-020 条件なしで検索すると検索が実行され結果領域が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 未選択＝全件（normalizeSearchData）。件数見出しまたは0件メッセージのいずれかが返る＝検索実行。
      await list.submitSearch();
      await expect(page).toHaveURL(LIST_RE);
      await list.seeSearchPerformed();
    });

    test("E2E-M04-12-021 該当しない商品名で検索すると0件メッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByProductName("__no_such_product_zzz_明らかに存在しない__");
      // 仕様文言（messages.ja.yaml:1542）でオラクル判定。POMヘルパに加え本文でも文言を明示する。
      await expect(page.locator("body")).toContainText(NO_RESULT);
      await list.seeNoResult();
    });

    test("E2E-M04-12-023 該当しない商品コードで検索すると0件メッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様: 商品コードも部分一致(LIKE)（正本md:78）。該当なしで search_no_result（:1542）。商品名021と対。
      await list.searchByProductCode("__no_such_code_zzz_明らかに存在しない__");
      await expect(page.locator("body")).toContainText(NO_RESULT);
      await list.seeNoResult();
    });

    test("E2E-M04-12-030 登録日From>Toで日付範囲エラーが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様: 登録日 From>To は create_date_end にエラーを付与しフォーム不正でセッション保存しない（分岐・例外節）。
      // 注: 実装は trans('admin.product.date_range_error') を使うが当該キーは messages に未定義（不具合候補#1）。
      // 文言はオラクル化せず、登録日欄付近にエラーが表示されることで検証する。
      await list.searchByCreateDateRange("2025-12-31", "2025-01-01");
      await expect(page).toHaveURL(LIST_RE);
      await expect(list.dateError.first()).toBeVisible();
    });

    test("E2E-M04-12-031 登録日範囲が正順なら日付エラーなく検索が実行される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByCreateDateRange("2025-01-01", "2025-12-31");
      await list.seeSearchPerformed(); // 正常系（境界内）。検索が実行されること
    });

    // ===== 検索条件クリア =====

    test("E2E-M04-12-040 検索条件クリア（?clear=1）で一覧へリダイレクトされる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      const list = new StockStockSplitJoinSearchListPage(page);
      await list.gotoClear();
      // 仕様: セッション破棄→admin_stock_split_join_list へリダイレクト→検索前状態
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.locator("body")).toContainText(SEARCH_FIRST);
    });

    test("E2E-M04-12-041 ?resume=1 で直前の検索条件が復元され検索実行状態が再表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(プロセスフロー#4 正本md:96 / Controller.php:111): 事前POSTでセッションに検索条件を保存し、
      // ?resume=1 で復元・再submit。検索前案内ではなく検索実行後の結果領域が再表示されることで判定。
      await list.submitSearch(); // 事前検索でセッション確立（未選択＝全件）
      await expect(page).toHaveURL(LIST_RE);
      await list.gotoResume();
      await list.seeSearchPerformed(); // 復元再表示＝検索実行済み（clear の検索前状態とは対）
    });

    // ===== 結合新規へ遷移（異常系） =====

    test("E2E-M04-12-050 結合新規遷移: productStockId未指定だとエラー表示で一覧へ戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      // 仕様: productStockId 未指定・不存在は admin.stock.join.source_not_found を表示し一覧へ戻す（分岐・例外節）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/join/new`);
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.locator("body")).toContainText(SOURCE_NOT_FOUND);
    });

    test("E2E-M04-12-053 結合新規遷移: 不存在のproductStockId指定でもエラー表示で一覧へ戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      // 仕様: productStockId 不存在も source_not_found を表示し一覧へ戻す（分岐・例外節 正本md:60 / Controller.php:516-520）。
      // 未指定050と対の「不存在ID」異常分岐。解決不能な巨大IDを使用（シード不要）。
      await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/product/stock/join/new?productStockId=999999999`
      );
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.locator("body")).toContainText(SOURCE_NOT_FOUND);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-12-051 結合新規遷移: 有効なproductStockIdで結合新規へリダイレクト（要: 在庫レコードのシード）",
      async () => {
        // 期待は仕様(利用者視点の入口 admin_stock_join_new_redirect→admin_stock_join_new)由来。
        // 有効な ProductStock を解決できるシード投入後に JOIN_NEW_RE で実装。
        void JOIN_NEW_RE;
      }
    );

    test.fixme(
      "E2E-M04-12-052 ステータス照会: status-snapshot が {ok,status_id} のJSONを返す（要: DtbStockSplitJoinのシード）",
      async () => {
        // 期待は仕様(利用者視点の入口 admin_stock_split_join_status_snapshot / Controller.php:74-83)由来。
        // 対象IDのシード投入後にレスポンスJSONで実装。
      }
    );

    test.fixme(
      "E2E-M04-12-022 検索結果一覧が登録日時の降順で表示される（要: 複数レコードのシードと安定観測）",
      async () => {
        // 期待は仕様(画面表示・一覧項目 表示順 s.createDate 降順)由来。十分なデータ投入後に実装。
      }
    );
  }
);
