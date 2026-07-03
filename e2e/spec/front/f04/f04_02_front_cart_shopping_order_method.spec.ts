/**
 * フロント カート「ご注文方法指定（注文情報の入力・確認・注文）」（F04-02）E2E。
 * integration_test/e2e/f04_02_front_cart_shopping_order_method_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 本画面は会員ログイン＋ロック済みカート（商品投入）が前提の破壊的フローが中心。
 * 非破壊に走る live は「カート未投入で購入手続きURLへ直接アクセスした際の誘導」（021/011/007）のみ。
 * 要シード/要ログイン/要カート/破壊的（購入確定）のケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontShoppingOrderMethodPage } from "../../../pages/front/f04/f04_02_front_cart_shopping_order_method.page";

test.describe("フロント > カート > ご注文方法指定（注文情報の入力・確認・注文）", { tag: ["@front", "@cart"] }, () => {
  // --- live（シード/資格情報/カート不要で非破壊に観測できる誘導） ---

  test("E2E-F04-02-021 カート未投入で購入手続きURLへ直接アクセスすると買い物かごへ戻される", async ({ page }) => {
    const shopping = new FrontShoppingOrderMethodPage(page);
    await shopping.gotoShopping();
    // 処理フロー「カート未ロック・空は買い物かごへ戻す」。ご注文方法指定フォームを表示しない。
    await shopping.seeBackToCart();
  });

  test("E2E-F04-02-011 カート未投入で確認・注文（非POST）に到達しても買い物かごへ戻される", async ({ page }) => {
    const shopping = new FrontShoppingOrderMethodPage(page);
    await shopping.gotoConfirm();
    // 注文確定判定順序#1/#3（未ロック・非POSTは買い物かごへ戻す）。
    await shopping.seeBackToCart();
  });

  test("E2E-F04-02-007 受注情報が無い状態で注文エラー画面に到達すると入力フォームを表示しない", async ({ page }) => {
    const shopping = new FrontShoppingOrderMethodPage(page);
    await shopping.gotoShoppingError();
    // 受注情報なしの異常案内。ご注文方法指定の入力フォーム（合計(税込)を含む）は表示しない。
    await shopping.seeNoOrderMethodForm();
  });

  // --- 要シード/要ログイン/要カート/破壊的。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F04-02-003 ロック済みカートで購入手続きを開くとご注文方法指定画面が表示される（要: SEED-F04-02-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F04-02-008 ご注文方法指定画面に注文情報の各表示要素が揃う（要: SEED-F04-02-CART）", async () => {});
  test.fixme("E2E-F04-02-013 合計欄に『合計(税込)』が表示される（要: SEED-F04-02-CART）", async () => {});
  test.fixme("E2E-F04-02-009 部分送信後にご注文方法指定画面へ戻る（要: SEED-F04-02-CART）", async () => {});
  test.fixme("E2E-F04-02-019 お届け先選択で配送先へ反映され同画面へ戻る（要: SEED-F04-02-CART/アドレス帳）", async () => {});
  test.fixme("E2E-F04-02-082 お支払い方法・要望・ポイント変更が受注へ反映され合計を再計算して同画面へ戻る（要: SEED-F04-02-CART）", async () => {});
  test.fixme("E2E-F04-02-083 お届け先変更（メッセージ送信）で要望を保存しお届け先設定一覧へ遷移する（要: SEED-F04-02-CART）", async () => {});
  test.fixme("E2E-F04-02-025 お届け先未選択でお届け先選択を送信するとご注文方法指定へ戻る（要: SEED-F04-02-CART）", async () => {});
  test.fixme("E2E-F04-02-023 未ログインかつ非会員未登録で購入手続きに進むとログイン画面へ誘導される（要: SEED-F04-02-CART/未ログイン）", async () => {});
  test.fixme("E2E-F04-02-006 注文確定に成功すると購入完了画面へ遷移する（要: SEED-F04-02-CART/破壊的・購入確定）", async () => {});
  test.fixme("E2E-F04-02-062 受注合計がマイナスのとき注文エラー画面へ遷移する（要: SEED-F04-02-NEGATIVE）", async () => {});
  test.fixme("E2E-F04-02-064 注文確定でお支払い方法が受注と不一致なら注文エラー画面へ遷移する（要: SEED-F04-02-CART/破壊的）", async () => {});
  test.fixme("E2E-F04-02-018 配送先が複数で複数配送設定が無効なら買い物かごへ戻る（要: SEED-F04-02-MULTI）", async () => {});
  test.fixme("E2E-F04-02-014 配送先が複数で複数配送設定が有効なら案内を一度表示する（要: SEED-F04-02-MULTI）", async () => {});
  test.fixme("E2E-F04-02-015 購入処理の想定外例外時にシステムエラーで注文エラー画面へ遷移する（要: 想定外例外誘発/実機）", async () => {});
  test.fixme("E2E-F04-02-066 お届け先選択で直近のお届け先IDがCookieへ保存される（要: SEED-F04-02-CART/Cookie確認）", async () => {});
  test.fixme("E2E-F04-02-080 受注作成時にプレオーダーID用Cookieが発行される（要: SEED-F04-02-CART/Cookie確認）", async () => {});
});
