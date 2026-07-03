/**
 * フロント 商品「商品一覧」（F03-01）E2E。
 * integration_test/e2e/f03_01_front_product_product_search_list_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f03-01_front_product_product_search_list.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本機能は非ログインで表示・検索・遷移が観測できる参照系のため、非破壊・シード不要のケースを live 実装する。
 * 具体的な商品ヒット件数・0件/上限超過メッセージ・DB検索相関・会員向け付随表示は
 * 要シード/要実機/要ログインのため test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontProductListPage } from "../../../pages/front/f03/f03_01_front_product_product_search_list.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 商品 > 商品一覧", { tag: ["@front", "@product"] }, () => {
  // --- live（非ログイン・非破壊・シード不要で観測可能） ---

  test("E2E-F03-01-003 検索条件なしで開くと検索フォームのみ表示し結果を組み立てない", async ({ page }) => {
    const list = new FrontProductListPage(page);
    await list.gotoInitial();
    await list.expectOnListUrl();
    await list.seeSearchForm();
    // 初期表示では商品数を表示しない（結果非表示）。期待は処理フロー「検索条件なしで一覧を開く」由来。
    await expect(page.locator("body")).not.toContainText("商品数:");
  });

  test("E2E-F03-01-002 未ログインでも商品一覧を閲覧できる", async ({ page }) => {
    const list = new FrontProductListPage(page);
    const res = await page.goto(list.searchUrl);
    // 権限・認可節：未ログインでも閲覧可能（ログイン画面へ誘導しない）。
    expect(res?.ok()).toBeTruthy();
    await list.expectOnListUrl();
    await expect(page).not.toHaveURL(/\/mypage\/login/);
  });

  test("E2E-F03-01-021 ロケール付きURLを直接開いても一覧の入口（検索フォーム）が表示される", async ({ page }) => {
    const list = new FrontProductListPage(page);
    await list.gotoInitial();
    await list.expectOnListUrl();
    await list.seeSearchForm();
  });

  test("E2E-F03-01-018 並び替えURL（sort=price&order=DESC）へ遷移し同一の一覧URLに留まる", async ({ page }) => {
    const list = new FrontProductListPage(page);
    await list.gotoWithQuery("name=e2e&sort=price&order=DESC");
    await list.expectOnListUrl();
    await expect(page).toHaveURL(/sort=price/);
    await expect(page).toHaveURL(/order=DESC/);
  });

  test("E2E-F03-01-019 ページ送りURL（page=2）へ遷移し同一の一覧URLに留まる", async ({ page }) => {
    const list = new FrontProductListPage(page);
    await list.gotoWithQuery("name=e2e&page=2");
    await list.expectOnListUrl();
    await expect(page).toHaveURL(/page=2/);
  });

  test("E2E-F03-01-020 在庫絞り込みURL（stock=1）へ遷移し同一の一覧URLに留まる", async ({ page }) => {
    const list = new FrontProductListPage(page);
    await list.gotoWithQuery("name=e2e&stock=1");
    await list.expectOnListUrl();
    await expect(page).toHaveURL(/stock=1/);
  });

  // --- 要シード/要実機/要ログイン。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F03-01-008 検索条件付き一覧で商品数「商品数:（件数）点」・並び替え・商品一覧・ページ送りが表示される（要: 商品シード）", async () => {});
  test.fixme("E2E-F03-01-007 商品サムネイルの遅延読み込みが描画されサムネイルから商品詳細（F03-02）へ遷移する（要: 商品シード/遅延読み込み実機確認）", async () => {});
  test.fixme("E2E-F03-01-012 在庫ありのみ（stock=1）で在庫がある商品規格に限定表示される（要: 在庫あり/切れ両方の商品シード）", async () => {});
  test.fixme("E2E-F03-01-014 一覧の各商品に抽出された商品規格の販売価格が表示される（要: 価格既知の商品シード）", async () => {});
  test.fixme("E2E-F03-01-016 1ページ規定件数60でページ分割される（要: 60件超の商品シード）", async () => {});
  test.fixme("E2E-F03-01-024 本店一覧経路で0件時「ご指定の条件に一致する商品が見つかりませんでした。」が表示される（要: ヒットしない条件/本店経路実機）", async () => {});
  test.fixme("E2E-F03-01-023 支店一覧経路で0件時に応答ステータス404かつ該当商品が見つからない旨を表示する（要: 支店経路/実機404）", async () => {});
  test.fixme("E2E-F03-01-056 上限超過時「ご指定の条件に一致する商品が多すぎます。さらに絞り込むための条件を追加してください。」が表示される（要: product_search_limit=9999超のシード）", async () => {});
  test.fixme("E2E-F03-01-022 主要条件未指定＋在庫すべて表示は全件検索とみなし空の一覧を返す（要: 全件判定の実機確認）", async () => {});
  test.fixme("E2E-F03-01-057 検索条件に合致する商品規格が一覧に含まれる（要: 条件既知の商品シード）", async () => {});
  test.fixme("E2E-F03-01-058 検索条件に合致しない商品規格が一覧に含まれない（要: 条件既知の商品シード）", async () => {});

  // creds があれば live 化する会員閲覧系（環境が整うまでは skip）
  test("E2E-F03-01-077 会員ログイン状態でも商品一覧を閲覧できる", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定（会員ログイン状態の再現に必要）");
    const list = new FrontProductListPage(page);
    await list.gotoInitial();
    await list.expectOnListUrl();
    await list.seeSearchForm();
  });
});
