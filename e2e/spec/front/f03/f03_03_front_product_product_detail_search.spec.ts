/**
 * フロント 商品「商品詳細検索」（F03-03）E2E。
 * integration_test/e2e/f03_03_front_product_product_detail_search_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f03-03_front_product_product_detail_search.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本機能は非ログインで詳細検索フォームの表示・入力・GET送信（商品一覧F03-01への遷移）が観測できる
 * 参照系のため、非破壊・シード不要のケースを live 実装する。
 * 検索結果の件数・条件合致（データ依存＝要シード。抽出はF03-01を正典）、実機フォーム制約（最大長・
 * 展開選択部品のセレクタ・隠しパラメータ）は test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontProductDetailSearchPage } from "../../../pages/front/f03/f03_03_front_product_product_detail_search.page";

test.describe("フロント > 商品 > 商品詳細検索", { tag: ["@front", "@product"] }, () => {
  // --- live（非ログイン・非破壊・シード不要で観測可能） ---

  test("E2E-F03-03-007 検索条件なしで開くと商品結果を表示せず詳細検索フォームを表示する", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    await search.gotoForm();
    await search.expectOnSearchUrl();
    await search.seeSearchForm();
    // 初期表示では検索結果（商品数）を組み立てない。期待は処理フロー「フォームを表示する」由来。
    await expect(page.locator("body")).not.toContainText("商品数:");
  });

  test("E2E-F03-03-008 商品名入力欄はオートコンプリート無効で表示される", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    await search.gotoForm();
    await expect(search.productNameInput).toBeVisible();
    // フロント挙動節：商品名入力欄はオートコンプリートを無効にする。
    await expect(search.productNameInput).toHaveAttribute("autocomplete", /off|nope/i);
  });

  test("E2E-F03-03-088 言語の展開選択（表示要素）が表示される", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    await search.gotoForm();
    // フロント挙動節「表示要素」：言語展開選択。文言は設計md由来。
    await expect(page.locator("body")).toContainText("言語");
  });

  test("E2E-F03-03-089 在庫の展開選択（表示要素）が表示される", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    await search.gotoForm();
    // フロント挙動節「表示要素」：在庫展開選択（すべて表示／在庫ありのみ）。
    await expect(page.locator("body")).toContainText("在庫");
  });

  test("E2E-F03-03-090 マナコストの展開選択（表示要素）が表示される", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    await search.gotoForm();
    // フロント挙動節「表示要素」：マナコスト展開選択。
    await expect(page.locator("body")).toContainText("マナコスト");
  });

  test("E2E-F03-03-009 商品名を入力し検索するとGETで検索エンドポイントへ遷移しproductクエリが付与される", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    await search.gotoForm();
    await search.searchByProductName("e2etest");
    // 処理フロー「フォームを送信する」：GETで商品一覧検索エンドポイントへ送る。クエリ`product`（入力項目節）。
    await search.expectOnSearchUrl();
    await expect(page).toHaveURL(/[?&]product=/);
  });

  test("E2E-F03-03-022 検索送信で応答ステータス200が返る", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    // GET送信（クエリ付き）で正常応答すること。入出力節「成功時出力」由来。
    const res = await page.goto(`${search.searchUrl}?product=e2etest`);
    expect(res?.ok()).toBeTruthy();
    await search.expectOnSearchUrl();
  });

  test("E2E-F03-03-021 ロケール付きURLを直接開いても詳細検索フォームの入口が表示される", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    await search.gotoForm();
    await search.expectOnSearchUrl();
    await search.seeSearchForm();
  });

  test("E2E-F03-03-002 未ログインでも詳細検索フォームを利用できる", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    const res = await page.goto(search.searchUrl);
    // 権限・認可節：未ログインでも利用可能（ログイン画面へ誘導しない）。
    expect(res?.ok()).toBeTruthy();
    await search.expectOnSearchUrl();
    await expect(page).not.toHaveURL(/\/mypage\/login/);
  });

  test("E2E-F03-03-025 全項目未入力で送信してもインラインエラーが出ず検索エンドポイントへ遷移する", async ({ page }) => {
    const search = new FrontProductDetailSearchPage(page);
    await search.gotoForm();
    await search.searchButton.click();
    // エラー処理／失敗時出力節：本フォームは入力値の検証で送信を止めず、インラインエラーを持たない。
    await search.expectOnSearchUrl();
  });

  // --- 要シード/要実機（展開選択部品・隠しパラメータ・最大長・データ依存）。保留（抜け漏れ可視化） ---
  test.fixme("E2E-F03-03-011 並び順・カードID・タグ・セールフラグが隠しパラメータとして引き継がれる（要: 一覧からの遷移コンテキスト/hidden項目 実機確認）", async () => {});
  test.fixme("E2E-F03-03-023 フォイル等の展開選択を選び送信するとfoilFlgクエリが付与される（要: 展開選択部品のセレクタ実機確認）", async () => {});
  test.fixme("E2E-F03-03-056 色・カードタイプのAND／OR既定値（OR）が送信クエリ（colorsType/cardtypesType）に付与される（要: ラジオ既定値/セレクタ実機確認）", async () => {});
  test.fixme("E2E-F03-03-026 商品名に最大長の値を入力しても文字数エラーとならず送信できる（要: 商品名最大長のフォーム制約 実機確認）", async () => {});
  test.fixme("E2E-F03-03-020 各条件（色・レアリティ・カードタイプ等）を選択し送信すると対応クエリ付与で商品一覧（F03-01）へ遷移する（要: 展開選択部品のセレクタ実機確認）", async () => {});
  test.fixme("E2E-F03-03-057 検索条件に合致する商品が一覧結果に含まれる（要: 条件既知の商品シード。抽出はF03-01を正典）", async () => {});
});
