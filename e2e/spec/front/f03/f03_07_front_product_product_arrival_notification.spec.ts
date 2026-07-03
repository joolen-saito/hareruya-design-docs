/**
 * フロント 商品「入荷時通知」（F03-07）E2E。
 * integration_test/e2e/f03_07_front_product_product_arrival_notification_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f03-07_front_product_product_arrival_notification.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3(HareruyaEc) の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 会員資格情報は ECCUBE_FRONT_USER/PASS（未設定時は認証必須ケースを test.skip）。
 * 本機能は会員ログイン・在庫切れ状態・非同期POST(CSRF)挙動を要する観点が多く、非ログインで観測できる
 * 誘導のみ live とし、要ログイン/要在庫切れ/要上限/要実機のケースは test.fixme（理由付き）で保留する。
 * 手動・対象外はケース表（付帯表2/2b）で全量管理し、spec には残さない。
 */
import { test, expect } from "@playwright/test";
import { FrontArrivalNotificationPage } from "../../../pages/front/f03/f03_07_front_product_product_arrival_notification.page";

test.describe("フロント > 商品 > 入荷時通知", { tag: ["@front", "@product"] }, () => {
  // --- live: 非ログインで観測可能な誘導 ---
  test("E2E-F03-07-021 未ログインで入荷通知依頼一覧URLへ直接アクセスするとログイン画面へ誘導される", async ({ page }) => {
    const arrival = new FrontArrivalNotificationPage(page);
    await arrival.gotoNotifyList();
    await arrival.seeLoginRedirect();
  });

  // --- 要ログイン/要在庫切れ/要上限/要実機。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F03-07-002 未ログインで入荷通知ボタン押下→未ログイン応答(nologin)・登録しない（要: SEED-F03-07-STOCKOUT/実機pushReceive）", async () => {});
  test.fixme("E2E-F03-07-007 未依頼の商品規格で依頼ボタン押下→依頼確認ダイアログ表示（要: 会員ログイン/SEED-F03-07-STOCKOUT/実機JS）", async () => {});
  test.fixme("E2E-F03-07-009 未依頼の商品規格で依頼→依頼成功応答(success)（要: 会員ログイン/SEED-F03-07-STOCKOUT）", async () => {});
  test.fixme("E2E-F03-07-010 依頼済みの商品規格で再度押下→取り消し応答(cancel)（要: 会員ログイン/SEED-F03-07-REQUEST）", async () => {});
  test.fixme("E2E-F03-07-013 入荷通知ボタン押下は画面遷移せず非同期で結果を反映（要: 会員ログイン/SEED-F03-07-STOCKOUT/実機JS）", async () => {});
  test.fixme("E2E-F03-07-008 特定できない商品規格→対象商品削除済み応答(fail)・登録しない（要: 実機pushReceive/CSRF要否確認）", async () => {});
  test.fixme("E2E-F03-07-017 依頼件数が上限以上→上限超過応答(fail)・登録しない（要: 会員ログイン/SEED-F03-07-LIMIT）", async () => {});
  test.fixme("E2E-F03-07-071 入荷通知依頼一覧に自分の依頼済み商品が表示される（要: 会員ログイン/SEED-F03-07-REQUEST）", async () => {});
});
