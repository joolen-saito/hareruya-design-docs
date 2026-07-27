/**
 * フロント 買い物かご「カート」（F04-01）E2E。
 * integration_test/e2e/f04_01_front_cart_cart_index_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f04-01_front_cart_cart_index.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 買い物かごへの商品投入・数量更新・削除・購入手続き遷移・XHR は要シード/要カート投入/要ログインのため
 * test.fixme（理由付き）で保留し、全量はケース表（付帯表）で管理する。
 * live は空カート状態（フレッシュな context = 商品未投入）で観測できる非破壊ケースのみ。
 */
import { test, expect } from "../../../fixtures/reachability.fixture";
import { FrontCartPage } from "../../../pages/front/f04/f04_01_front_cart_cart_index.page";

test.describe("フロント > 買い物かご > カート", { tag: ["@front", "@cart"] }, () => {
  // --- live（非破壊。空カート状態で観測できる） ---
  test("E2E-F04-01-019 買い物かご画面を開くと見出しが表示される", async ({ page }) => {
    const cart = new FrontCartPage(page);
    await cart.gotoCart();
    await cart.seeCartHeading();
  });

  test("E2E-F04-01-017 商品未投入では空カート案内が表示される", async ({ page }) => {
    const cart = new FrontCartPage(page);
    await cart.gotoCart();
    await cart.seeEmptyCart();
  });

  test("E2E-F04-01-056 空カート時に「他の商品を見る」リンクが表示される", async ({ page }) => {
    const cart = new FrontCartPage(page);
    await cart.gotoCart();
    await expect(cart.viewOtherLink).toBeVisible();
  });

  test("E2E-F04-01-064 空カート時は購入手続きへボタンを表示しない", async ({ page }) => {
    const cart = new FrontCartPage(page);
    await cart.gotoCart();
    await expect(cart.checkoutButton).toHaveCount(0);
  });

  // --- 要カート投入/要シード/要ログイン/要XHR。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F04-01-001 カート表示で商品一覧・数量・金額・送料無料案内が表示される（要: SEED-F04-01-CART/カート投入）", async () => {});
  test.fixme("E2E-F04-01-012 カート行にサムネ・商品名リンク・単価・数量欄・金額・削除ボタンが表示される（要: カート投入）", async () => {});
  test.fixme("E2E-F04-01-013 数量入力欄 name=\"qty[商品規格ID]\" が最大3桁で表示される（要: カート投入）", async () => {});
  test.fixme("E2E-F04-01-022 行の金額が単価×数量で表示される（要: SEED-F04-01-CART）", async () => {});
  test.fixme("E2E-F04-01-023 合計(税込)がカート合計金額で表示される（要: SEED-F04-01-CART）", async () => {});
  test.fixme("E2E-F04-01-002 再計算で入力数量にカートが更新され買い物かご画面へ戻る（要: カート投入）", async () => {});
  test.fixme("E2E-F04-01-027 数量0以下で再計算すると当該商品が削除される（要: カート投入）", async () => {});
  test.fixme("E2E-F04-01-044 数量-1操作で数量が1減る（0未満は削除）（要: カート投入）", async () => {});
  test.fixme("E2E-F04-01-003 削除ボタンで当該商品を取り除き買い物かご画面へ戻る（要: カート投入/トークン）", async () => {});
  test.fixme("E2E-F04-01-015 カート一括削除でカートが空になり買い物かご画面へ戻る（要: カート投入）", async () => {});
  test.fixme("E2E-F04-01-016 購入手続きへボタン押下で注文情報入力へ遷移する（要: SEED-F04-01-CART/在庫）", async () => {});
  test.fixme("E2E-F04-01-006 購入手続きへ進む（メッセージ無し）でカートロックし注文情報入力へ遷移する（要: SEED-F04-01-CART）", async () => {});
  test.fixme("E2E-F04-01-021 購入グループが複数のとき同時注文不可エラーが表示される（要: SEED-F04-01-MULTIGROUP）", async () => {});
  test.fixme("E2E-F04-01-009 add_show で1商品を追加し買い物かご画面へリダイレクトする（要: SEED-F04-01-PRODUCT）", async () => {});
  test.fixme("E2E-F04-01-007 POST /cart/add で1商品を追加しカート内容をJSONで返す（要: SEED-F04-01-PRODUCT/API統合）", async () => {});
  test.fixme("E2E-F04-01-008 POST /cart/add_bulk で商品配列を追加しカート内容をJSONで返す（要: SEED-F04-01-PRODUCT/API統合）", async () => {});
  test.fixme("E2E-F04-01-010 GET /cart/get でカート内容をJSONで返す（要: カート投入/API統合）", async () => {});
  test.fixme("E2E-F04-01-011 未ログインの入荷通知依頼XHRでログインを促すメッセージをJSONで返す（要: SEED-F04-01-SOLDOUT/API統合）", async () => {});
  test.fixme("E2E-F04-01-047 カート追加XHRで追加失敗時にリクエストエラーをJSONで返す（要: SEED-F04-01-PRODUCT/API統合）", async () => {});
});
