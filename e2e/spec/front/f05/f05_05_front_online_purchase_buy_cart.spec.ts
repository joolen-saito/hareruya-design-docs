/**
 * フロント ネット買取「買取カート」（F05-05）E2E。
 * integration_test/e2e/f05_05_front_online_purchase_buy_cart_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f05-05_front_online_purchase_buy_cart.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 買取カートの表示・操作は会員ログインを要しない（権限・認可節）。空カートはフレッシュなセッションで観測できるため live。
 * 要シード/要カート投入/要実機（数量更新・削除・追加・買取手続きへ）のケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontPurchaseCartPage } from "../../../pages/front/f05/f05_05_front_online_purchase_buy_cart.page";

test.describe("フロント > ネット買取 > 買取カート", { tag: ["@front", "@purchase"] }, () => {
  test("E2E-F05-05-002 未ログインで買取カートを表示できる", async ({ page }) => {
    const cart = new FrontPurchaseCartPage(page);
    await cart.gotoCart();
    // 会員ログインを要求されず、カート画面（見出し）が表示されること。
    await cart.seeCartScreen();
  });

  test("E2E-F05-05-009 見出し「買取希望品カート」が表示される", async ({ page }) => {
    const cart = new FrontPurchaseCartPage(page);
    await cart.gotoCart();
    await expect(cart.heading).toBeVisible();
  });

  test("E2E-F05-05-007 空カート時に空メッセージが表示される", async ({ page }) => {
    const cart = new FrontPurchaseCartPage(page);
    await cart.gotoCart();
    // 空カート案内文（表示メッセージ節・空カート）。フレッシュセッションはカートが空。
    await cart.seeEmptyCartMessage();
  });

  test("E2E-F05-05-021 買取カートURLへ直接アクセスするとカート画面が表示される", async ({ page }) => {
    const cart = new FrontPurchaseCartPage(page);
    await cart.gotoCart();
    // 保護対象でなく、ログイン画面へ誘導されずカート画面が表示されること。
    await cart.seeCartScreen();
  });

  test("E2E-F05-05-015 「商品一覧へ戻る」でネット買取トップへ遷移する", async ({ page }) => {
    const cart = new FrontPurchaseCartPage(page);
    await cart.gotoCart();
    await cart.backToListButton.click();
    // ネット買取トップ（F05-01）へ遷移し、カート画面から離れること（厳密な遷移先URLは要実機確認）。
    await expect(page).not.toHaveURL(/\/purchase\/cart(?:\?|$)/);
  });

  // --- 要シード/要カート投入/要実機。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F05-05-008 商品があるカートで明細・小計・各ボタンが表示される（要: 買取カート投入）", async () => {});
  test.fixme("E2E-F05-05-013 合計が税込小計として表示される（要: 買取カート投入）", async () => {});
  test.fixme("E2E-F05-05-022 小計が各明細の総和に一致する（要: 買取カート投入・複数明細）", async () => {});
  test.fixme("E2E-F05-05-014 「買取手続きへ」で買取手続き画面(F05-06)へ遷移する（要: 買取カート投入）", async () => {});
  test.fixme("E2E-F05-05-006 カート追加成功で完了ダイアログが表示される（要: SEED-F05-05-BUYABLE-PRODUCT/非同期JS挙動・要実機）", async () => {});
  test.fixme("E2E-F05-05-010 同一商品を上限超で追加すると上限メッセージが表示される（要: 同一商品を上限近くまで投入/非同期・要実機）", async () => {});
  test.fixme("E2E-F05-05-074 追加の上限超過時に上限超過JSON(HTTP400/overlimit)が返る（要: 同一商品20点投入/APIルート要実機確認）", async () => {});
  test.fixme("E2E-F05-05-016 商品クラスID未指定の追加はエラー応答(HTTP500相当)となる（要: APIルート/応答仕様要実機確認）", async () => {});
  test.fixme("E2E-F05-05-017 既存商品の再追加で数量が加算される（要: 買取カート投入/買取対象商品）", async () => {});
  test.fixme("E2E-F05-05-082 数量再計算で入力数量に更新される（要: 買取カート投入）", async () => {});
  test.fixme("E2E-F05-05-018 数量を0・非数値に更新すると当該商品が外れる（要: 買取カート投入）", async () => {});
  test.fixme("E2E-F05-05-019 数量更新で上限超過すると更新が中断される（要: 買取カート投入）", async () => {});
  test.fixme("E2E-F05-05-003 カート内商品を削除するとカートから外れる（要: 買取カート投入）", async () => {});
  test.fixme("E2E-F05-05-001 削除のなりすまし対策トークンを検証する（要: 買取カート投入/DOM改ざん・要実機）", async () => {});
  test.fixme("E2E-F05-05-020 カートに無い商品の削除はカート表示へ戻る（要: 買取カート投入）", async () => {});
});
