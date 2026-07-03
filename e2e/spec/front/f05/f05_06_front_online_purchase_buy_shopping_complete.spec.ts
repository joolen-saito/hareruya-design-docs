/**
 * フロント ネット買取「買取手続き〜完了」（F05-06）E2E。
 * integration_test/e2e/f05_06_front_online_purchase_buy_shopping_complete_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f05-06_front_online_purchase_buy_shopping_complete.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 本機能は 記入→ログイン→確認→完了 の破壊的フローの終端。完了画面や確定副作用の観測は
 * 買取カート投入・会員ログイン・申込確定が前提のため、非破壊で走る 2 件（fill ガード / complete 直接アクセス）を
 * live とし、要シード/要ログイン/要申込確定の自動化ケースは test.fixme（理由付き）で保留する。
 * 手動/間接・対象外はケース表（付帯表）で全量管理し、spec には残さない。
 */
import { test, expect } from "@playwright/test";
import { FrontPurchaseCompletePage } from "../../../pages/front/f05/f05_06_front_online_purchase_buy_shopping_complete.page";

test.describe("フロント > ネット買取 > 買取手続き〜完了", { tag: ["@front", "@purchase"] }, () => {
  // --- live（非破壊。買取カート未投入・未ログインの素の状態で観測） ---

  test("E2E-F05-06-033 カートが空のとき記入画面を表示せず買取カートへ誘導する", async ({ page }) => {
    const p = new FrontPurchaseCompletePage(page);
    await p.gotoFill();
    // カート無のため記入画面（確認フォーム）は表示されず買取カートへ誘導される（設計md 処理フロー 記入#2 / 画面遷移）。
    await p.seeFillFormNotShown();
  });

  test("E2E-F05-06-021 完了画面へ直接アクセスするとオーダーID無しで表示される", async ({ page }) => {
    const p = new FrontPurchaseCompletePage(page);
    await p.gotoComplete();
    // オーダーIDのセッション無し（未確定）のとき、有効なオーダーIDは表示されない（設計md エッジケース 完了再訪 / 権限・認可）。
    await p.seeNoOrderId();
  });

  // --- 要シード（買取カート投入）/要会員ログイン/要申込確定。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F05-06-003 カートと会員ログインを確認して記入画面を表示する（要: SEED-F05-06-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F05-06-007 記入・確認画面のUI部品が表示される（要: SEED-F05-06-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F05-06-016 自動承諾の選択肢が表示される（要: SEED-F05-06-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F05-06-009 適格請求書発行事業者の説明モーダルが表示される（要: SEED-F05-06-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F05-06-034 カートあり・未ログインで記入・確認すると買取ログインへ誘導する（要: SEED-F05-06-CART/未ログイン）", async () => {});
  test.fixme("E2E-F05-06-024 職業未登録会員が職業未入力で確定すると必須エラーとなる（要: SEED-F05-06-CART/SEED-F05-06-NEWMEMBER）", async () => {});
  test.fixme("E2E-F05-06-029 口座番号は数字のみ最大7桁で8桁超過は入力エラーとなる（要: SEED-F05-06-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F05-06-030 個口数は1〜20の範囲内であればエラーとならない（要: SEED-F05-06-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F05-06-031 自動承諾を選択して確定できる（要: SEED-F05-06-CART/会員ログイン/申込確定）", async () => {});
  test.fixme("E2E-F05-06-056 適格請求書「はい」で登録番号未入力だと専用メッセージとなる（要: SEED-F05-06-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F05-06-018 登録番号に全角を含むと専用メッセージとなる（要: SEED-F05-06-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F05-06-035 適格請求書「いいえ」なら登録番号を検証しない（要: SEED-F05-06-CART/会員ログイン）", async () => {});
  test.fixme("E2E-F05-06-015 妥当な入力で確定すると完了画面へ遷移しオーダーIDが表示される（要: SEED-F05-06-CART/会員ログイン/申込確定）", async () => {});
  test.fixme("E2E-F05-06-013 完了画面の見出し「買取依頼完了」が表示される（要: SEED-F05-06-CART/会員ログイン/申込確定）", async () => {});
  test.fixme("E2E-F05-06-014 完了画面に御礼・発送案内が表示される（要: SEED-F05-06-CART/会員ログイン/申込確定）", async () => {});
  test.fixme("E2E-F05-06-006 完了後は買取カートのセッションが破棄される（要: SEED-F05-06-CART/会員ログイン/申込確定）", async () => {});
  test.fixme("E2E-F05-06-001 確定トークンを改ざんすると買取受注が登録されない（要: SEED-F05-06-CART/会員ログイン/DOM改ざん）", async () => {});
});
