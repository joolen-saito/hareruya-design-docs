/**
 * フロント カート「決済〜購入完了（ご注文完了）」（F04-04）E2E。
 * integration_test/e2e/f04_04_front_cart_shopping_complete_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f04-04_front_cart_shopping_complete.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 購入完了画面（GET /{_locale}/shopping/complete）は注文確定を経た後にのみ正規表示される破壊的フローの終端。
 * - live: 完了状態が無い直接アクセス→トップ誘導（021）のみ、シード/資格情報なしで非破壊に観測可能。
 * - fixme: 完了画面の各表示要素・エラー画面・ロケール遷移・完了後セッション初期化は注文確定を前提とするため保留（要: 注文確定/SEED-...）。
 * 手動/間接（在庫更新・受注作成・タグログ）はケース表で全量管理し spec には残さない。
 */
import { test } from "@playwright/test";
import { FrontShoppingCompletePage } from "../../../pages/front/f04/f04_04_front_cart_shopping_complete.page";

test.describe("フロント > カート > 決済〜購入完了（ご注文完了）", { tag: ["@front", "@cart"] }, () => {
  // --- live: 完了状態なしの直接アクセス→トップ誘導（非破壊・シード不要） ---
  test("E2E-F04-04-021 完了状態が無いまま購入完了URLへ直接アクセスするとトップへ戻る", async ({ page }) => {
    const complete = new FrontShoppingCompletePage(page);
    await complete.gotoComplete();
    // 期待は処理フロー「購入を完了する #1（受注IDなしはトップへ）」＋画面遷移由来。
    await complete.seeRedirectedToTop();
  });

  // --- fixme: 注文確定/シードを要する自動化ケース（抜け漏れ可視化） ---
  test.fixme("E2E-F04-04-006 購入完了画面に完了の各表示要素が表示される（要: 注文確定/SEED-F04-04-ORDER）", async () => {});
  test.fixme("E2E-F04-04-009 購入完了画面に完了見出し「ご注文完了」が表示される（要: 注文確定/SEED-F04-04-ORDER）", async () => {});
  test.fixme("E2E-F04-04-010 購入完了画面に御礼「ご注文ありがとうございました。」が表示される（要: 注文確定/SEED-F04-04-ORDER）", async () => {});
  test.fixme("E2E-F04-04-011 購入完了画面に注文番号が表示される（要: 注文確定/SEED-F04-04-ORDER）", async () => {});
  test.fixme("E2E-F04-04-023 注文確定に成功すると /shopping/complete へ到達する（要: 注文確定/SEED-F04-04-ORDER）", async () => {});
  test.fixme("E2E-F04-04-008 店頭受取の注文では完了表示が店頭向けに切り替わる（要: 店頭受取注文/SEED-F04-04-TC）", async () => {});
  test.fixme("E2E-F04-04-015 店頭受取はTC注文番号・それ以外はご注文番号（8桁）を表示する（要: SEED-F04-04-TC/ORDER）", async () => {});
  test.fixme("E2E-F04-04-019 表示ロケール不一致のときロケールを合わせたURLへ遷移する（要: ロケール不一致/SEED-F04-04-LOCALE）", async () => {});
  test.fixme("E2E-F04-04-012 受注ステータス想定外のとき購入処理エラー画面が表示される（要: SEED-F04-04-STATUS-ABNORMAL/文言実機確認）", async () => {});
  test.fixme("E2E-F04-04-017 受注ステータス想定外のとき完了せずエラー画面へ遷移する（要: SEED-F04-04-STATUS-ABNORMAL）", async () => {});
  test.fixme("E2E-F04-04-013 SPLINKS決済記録なしのとき決済記録不整合エラー画面が表示される（要: SEED-F04-04-SLN-NORECORD/文言実機確認）", async () => {});
  test.fixme("E2E-F04-04-018 SPLINKS決済記録なしのとき受注を処理中へ戻しエラー画面へ遷移する（要: SEED-F04-04-SLN-NORECORD）", async () => {});
  test.fixme("E2E-F04-04-014 購入完了後はセッション初期化され完了画面再訪でトップへ戻る（要: 注文確定/SEED-F04-04-ORDER）", async () => {});

  // 参考: seeCompletionScreen / seeShoppingProcessError / seeNoSlnPaymentError は Page Object に実装済み。
  // 上記 fixme は注文確定(SEED)が整い次第 live 化する。手動/間接(020,074,007)はケース表で管理する。
});
