/**
 * フロント ネット買取「買取詳細検索」（F05-02）E2E。
 * integration_test/e2e/f05_02_front_online_purchase_buy_product_search_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f05-02_front_online_purchase_buy_product_search.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 買取詳細検索はGET・非破壊のため、フォーム表示・検索送信・URL引き継ぎ・全件検索抑止は live で実装する。
 * 結果内容（該当レコード・状態NM/高額除外・価格順・タグ説明・サジェスト）は要シード/要実機のため test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontPurchaseSearchPage } from "../../../pages/front/f05/f05_02_front_online_purchase_buy_product_search.page";

test.describe("フロント > ネット買取 > 買取詳細検索", { tag: ["@front", "@purchase"] }, () => {
  // --- live: シード/資格情報不要・非破壊で走る（GET検索） ---

  test("E2E-F05-02-009 クエリなしで検索フォームのみを表示し検索を実行しない", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    await search.gotoSearchForm();
    await search.seeSearchForm();
    // クエリなしでは検索フォームのみを表示する（設計書「処理フロー」「エッジケース: クエリが空」）。
    await expect(page).toHaveURL(/\/purchase\/search(?:$|\?)/);
  });

  test("E2E-F05-02-007 検索フォームの主要入力部品が表示される", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    await search.gotoSearchForm();
    // カード名入力・検索ボタンが表示される（設計書「フロント挙動: 表示要素」）。
    await expect(search.cardNameInput).toBeVisible();
    await expect(search.searchButton).toBeVisible();
  });

  test("E2E-F05-02-021 検索URL直接アクセスで未ログインでも検索フォームが表示される", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    await search.gotoSearchForm();
    // 未ログインで検索・閲覧可能（設計書「権限・認可」）。ログイン画面へ誘導されない。
    await expect(page).toHaveURL(/\/purchase\/search(?:$|\?)/);
    await expect(search.searchButton).toBeVisible();
  });

  test("E2E-F05-02-018 クエリ空で開くと検索フォームのみを表示する", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    await search.gotoSearchForm();
    await expect(search.searchButton).toBeVisible();
  });

  test("E2E-F05-02-015 カード名を指定して検索送信するとGETで同一エンドポイントへ遷移しURLに条件が載る", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    await search.gotoSearchForm();
    await search.searchByCardName("e2e-test-card");
    // 検索送信はGET。買取商品一覧（F05-03）は同一エンドポイントに条件付きで表示される（設計書「画面遷移」「フロント挙動」）。
    await expect(page).toHaveURL(/\/purchase\/search\?/);
    await expect(page).toHaveURL(/product=/);
  });

  test("E2E-F05-02-020 複数条件付きで検索エンドポイントを開くと条件を反映した一覧へ遷移する", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    const res = await search.gotoSearchWithQuery("category=1&colors%5B%5D=1");
    // 指定条件で買取商品を絞り込み一覧を表示する（設計書「利用者視点の入口」「画面遷移」）。エラー応答は持たない。
    expect(res?.status() ?? 200).toBeLessThan(400);
    await expect(page).toHaveURL(/\/purchase\/search\?/);
    await expect(page).toHaveURL(/category=1/);
  });

  test("E2E-F05-02-016 表示順・並び順を付けて送信するとクエリで引き継がれる", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    await search.gotoSearchWithQuery("product=e2e-test-card&sort=price&order=desc");
    // 表示順(sort)・並び順(order)はクエリで引き継ぐ（設計書「業務ルール・計算: 表示順」「遷移時に引き継ぐ状態」）。
    await expect(page).toHaveURL(/sort=price/);
    await expect(page).toHaveURL(/order=desc/);
  });

  test("E2E-F05-02-023 条件皆無は全件検索を抑止し検索を実行しない", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    const res = await search.gotoSearchForm();
    // 検索条件がいずれも無い場合は全件検索とみなし検索を実行しない（設計書「集計条件: 全件検索の抑止」「エラー処理」）。
    expect(res?.status() ?? 200).toBeLessThan(400);
    await expect(search.searchButton).toBeVisible();
  });

  test("E2E-F05-02-080 送信した検索条件が一覧へクエリとして引き継がれる", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    await search.searchByCardName("e2e-carry-over");
    // 送信した検索条件は一覧へクエリとして引き継ぐ（設計書「データ整合性」「遷移時に引き継ぐ状態」）。
    await expect(page).toHaveURL(/product=/);
  });

  test("E2E-F05-02-022 検索送信でエラー応答を返さずページが表示される", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    const res = await search.gotoSearchWithQuery("product=e2e-test-card");
    // 本機能固有のエラー応答は持たない（設計書「入出力: 失敗時出力」「エラー処理」）。
    expect(res?.status() ?? 200).toBeLessThan(400);
  });

  test("E2E-F05-02-013 無効な条件を指定しても固有エラー応答を返さない", async ({ page }) => {
    const search = new FrontPurchaseSearchPage(page);
    const res = await search.gotoSearchWithQuery("product=&category=999999");
    // 未指定/非該当の条件は絞り込みに使わず、固有エラー応答を持たない（設計書「バリデーション」「エラー処理」）。
    expect(res?.status() ?? 200).toBeLessThan(400);
  });

  // --- 要シード/要実機。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F05-02-026 カード名に最大長255文字を入力しても文字数エラーとならず検索継続（要: 実機フォーム制約確認）", async () => {});
  test.fixme("E2E-F05-02-027 カード名に最大長超（256文字）を入力した際の扱い（要: 実機フォーム制約確認）", async () => {});
  test.fixme("E2E-F05-02-056 状態NMの該当買取商品が結果に含まれる（要: SEED-F05-02-BUY-PRODUCT）", async () => {});
  test.fixme("E2E-F05-02-057 状態NM以外・高額商品コード保持は結果に含まれない（要: SEED-F05-02-BUY-PRODUCT）", async () => {});
  test.fixme("E2E-F05-02-072 絞り込み結果（買取価格付き商品）が取得される（要: SEED-F05-02-BUY-PRODUCT）", async () => {});
  test.fixme("E2E-F05-02-083 buy_price 価格順（高い順/安い順）で並び替えられる（要: SEED-F05-02-BUY-PRODUCT）", async () => {});
  test.fixme("E2E-F05-02-010 買取特集タグ指定でタグ説明文を取得し一覧の案内に用いる（要: SEED-F05-02-TAG / F05-03）", async () => {});
});
