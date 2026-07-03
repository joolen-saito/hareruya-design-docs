/**
 * フロント ネット買取「買取商品一覧（買取価格一覧）」（F05-03）E2E。
 * integration_test/e2e/f05_03_front_online_purchase_buy_product_list_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f05-03_front_online_purchase_buy_product_list.md 由来（オラクル独立性）。
 * pf-eccube3/ec-cube-enterprise の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本機能は一覧表示（GET・参照系・非破壊）が中心で会員ログイン不要（権限・認可: 未ログイン閲覧可）。
 * シード（買取価格付き商品・0件条件・上限超過データ・買取特集タグ）が要るケースは test.fixme（理由付き）で保留し、
 * 全量はケース表で管理する。live は環境依存の件数など固定値を判定しない（設計由来の観測に限定）。
 */
import { test, expect } from "@playwright/test";
import { FrontPurchaseListPage } from "../../../pages/front/f05/f05_03_front_online_purchase_buy_product_list.page";

test.describe("フロント > ネット買取 > 買取商品一覧", { tag: ["@front", "@purchase"] }, () => {
  test("E2E-F05-03-002 未ログインでも買取商品一覧を閲覧できる", async ({ page }) => {
    const list = new FrontPurchaseListPage(page);
    await list.gotoList("");
    // 権限・認可: 未ログイン閲覧可。ログイン画面へ誘導されないこと。
    await list.seeViewableWithoutLogin();
  });

  test("E2E-F05-03-007 買取商品一覧の入口が表示される（下部に検索フォーム等の一覧UI）", async ({ page }) => {
    const list = new FrontPurchaseListPage(page);
    await list.gotoList("");
    await expect(list.body).toBeVisible();
    // 画面下部の検索フォーム（一覧は検索フォームと同一エンドポイントが返す）。
    await expect(list.searchForm).toBeVisible();
  });

  test("E2E-F05-03-014 表示順クエリ（価格 高い順）を合成した一覧URLが受理される", async ({ page }) => {
    const list = new FrontPurchaseListPage(page);
    await list.gotoList("sort=price&order=DESC&page=1");
    // 表示順は既存条件にGET合成される（利用者視点の入口・遷移時に引き継ぐ状態）。
    await expect(page).toHaveURL(/sort=price/);
    await expect(page).toHaveURL(/\/purchase\/search/);
  });

  test("E2E-F05-03-021 検索条件付きURLへ直接アクセスすると条件を反映した一覧URLになる", async ({ page }) => {
    const list = new FrontPurchaseListPage(page);
    await list.gotoList("category_id=1&page=1");
    // URL直接アクセス: 引き継いだ検索条件が一覧に反映される（データ整合性: 検索条件と表示）。
    await expect(page).toHaveURL(/\/purchase\/search/);
    await expect(page).toHaveURL(/category_id=1/);
  });

  test("E2E-F05-03-032 範囲外の表示順/ページ番号はエラーにせず既定へ正規化される", async ({ page }) => {
    const list = new FrontPurchaseListPage(page);
    // バリデーション: sort/order は既定へ、page は範囲内へ正規化（範囲外でも検証エラーとしない）。
    await list.gotoList("sort=__invalid__&order=__x__&page=99999");
    await expect(list.body).toBeVisible();
    // 正規化により検証エラー文言を出さない（一覧本文の0件/上限案内は別ケースで判定）。
    await expect(list.body).not.toContainText("バリデーション");
  });

  // --- 要シード/要実機。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F05-03-009 一覧表示時に「商品数: N点」が表示される（要: 買取結果ありシード）", async () => {});
  test.fixme("E2E-F05-03-010 総件数が上限9999以下のとき実体を取得して一覧に並べる（要: 買取結果ありシード）", async () => {});
  test.fixme("E2E-F05-03-013 上限9999超過時は実体を取得せず超過案内を表示する（要: 上限超過データ）", async () => {});
  test.fixme("E2E-F05-03-015 買取価格が500円以上の商品に数量入力とカート追加ボタンが表示される（要: 500円以上の買取価格シード）", async () => {});
  test.fixme("E2E-F05-03-016 各商品に登録済み買取価格が表示される（要: 買取価格付き商品シード）", async () => {});
  test.fixme("E2E-F05-03-017 検索結果0件時にHTTP404で「お探しのカードは見つかりませんでした」案内を表示する（要: 0件条件の確定）", async () => {});
  test.fixme("E2E-F05-03-018 上限9999超過時に「ご指定の条件に一致する商品が多すぎます…」を表示する（要: 上限超過データ）", async () => {});
  test.fixme("E2E-F05-03-019 買取価格が500円未満の商品はカート追加ボタンを表示しない（要: 500円未満の買取価格シード）", async () => {});
  test.fixme("E2E-F05-03-020 買取特集タグ複数指定時はタグ説明文を表示しない（1件指定時のみ表示）（要: 買取特集タグシード）", async () => {});
  test.fixme("E2E-F05-03-022 表示される買取価格が参照時点の商品サブクラス買取価格に一致する（要: 既知買取価格シード）", async () => {});
});
