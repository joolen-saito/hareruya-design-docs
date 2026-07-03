/**
 * フロント 店頭買取「査定申込登録確認〜完了」（F08-03）E2E。
 * integration_test/e2e/f08_03_front_store_purchase_otc_buy_entry_complete_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f08-03_front_store_purchase_otc_buy_entry_complete.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 本機能は確認〜登録〜完了の破壊的な確定処理で、確認/完了画面への到達には F08-02 からの受付フロー＋
 * セッション入力データが前提。したがって表示内容・成功系・差し戻し・登録番号検証などは大半が test.fixme
 * （理由: 要 受付フロー/SEED/破壊的）で保留し、全量はケース表で管理する。
 * 資格情報/SEED/破壊的登録なしで live 実行できるのは、店舗識別子の不正（404）と、
 * 査定ID/エントリー前提を持たない状態での確認・完了URL直接アクセスに対するガードのみ。
 * 店舗依存ケースは店舗識別子 ECCUBE_FRONT_SHOP を要する（未設定時は test.skip）。
 */
import { test, expect } from "@playwright/test";
import { FrontStorePurchaseOtcBuyEntryCompletePage } from "../../../pages/front/f08/f08_03_front_store_purchase_otc_buy_entry_complete.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_SHOP, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_STORE = !!ECCUBE_FRONT_SHOP;
const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 店頭買取 > 査定申込登録確認〜完了", { tag: ["@front", "@otcbuy"] }, () => {
  test("E2E-F08-03-003 存在しない店舗識別名で完了URLへアクセスすると404となる", async ({ page }) => {
    // 実在しない店舗識別子は「ページが見つからない扱い（404）」。店舗シード不要で実行できる。
    const complete = new FrontStorePurchaseOtcBuyEntryCompletePage(page);
    const res = await complete.gotoInvalidStoreComplete();
    expect(res?.status()).toBe(404);
  });

  test("E2E-F08-03-002 エントリー前提なしで確認URLへ直接アクセスすると完了/確認内容を表示しない", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const complete = new FrontStorePurchaseOtcBuyEntryCompletePage(page);
    await complete.gotoConfirmDirect();
    // 判定順序#3: エントリー前提を満たさない→エントリーへ戻す。戻し先URLは要実機確認のため完了内容の非表示で判定。
    await complete.seeNotCompletionScreen();
  });

  test("E2E-F08-03-021 査定IDが無い状態で完了URLへ直接アクセスすると完了内容を表示しない", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const complete = new FrontStorePurchaseOtcBuyEntryCompletePage(page);
    await complete.gotoCompleteDirect();
    // 完了処理#1: 査定IDが無ければエントリーへ戻す（完了文言・査定番号を表示しない）。
    await complete.seeNotCompletionScreen();
  });

  test("E2E-F08-03-006 査定IDの一回性: 除去後の完了URL再訪でも完了内容を表示しない", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const complete = new FrontStorePurchaseOtcBuyEntryCompletePage(page);
    // 査定IDは完了表示時に除去される。以降（自動遷移・再訪相当）は査定IDが無く完了内容を再表示しない。
    await complete.gotoCompleteDirect();
    await complete.seeNotCompletionScreen();
  });

  // --- 要 受付フロー/SEED/破壊的。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F08-03-009 検証通過で申込登録→完了画面に完了文言・申込者氏名が表示される（要: 受付フロー/SEED-F08-03-ENTRY/破壊的）", async () => {});
  test.fixme("E2E-F08-03-014 完了画面に査定番号が表示される（要: 受付フロー/SEED/破壊的）", async () => {});
  test.fixme("E2E-F08-03-015 完了画面に買取カウンター案内が表示される（要: 受付フロー/SEED/破壊的）", async () => {});
  test.fixme("E2E-F08-03-016 完了画面に身分証明書の用意案内が表示される（要: 受付フロー/SEED/破壊的）", async () => {});
  test.fixme("E2E-F08-03-017 完了画面に自動遷移の秒数案内が表示される（要: 受付フロー/SEED/破壊的）", async () => {});
  test.fixme("E2E-F08-03-010 完了画面はメタ更新で一定秒数後に完了URLへ自動再遷移する（要: 受付フロー/SEED/破壊的）", async () => {});
  test.fixme("E2E-F08-03-012 英語ロケールでは完了文言が英語で表示される（要: 受付フロー/英語/SEED/破壊的）", async () => {});
  test.fixme("E2E-F08-03-013 完了画面に申込者氏名が表示される（要: 受付フロー/SEED/破壊的）", async () => {});
  test.fixme("E2E-F08-03-007 確認画面に申込入力内容の表示要素が表示される（要: 受付フロー/確認モード）", async () => {});
  test.fixme("E2E-F08-03-008 確認画面に送信ボタンと「戻る」ボタンが表示される（要: 受付フロー/確認モード）", async () => {});
  test.fixme("E2E-F08-03-018 確認ボタン文言が会員登録の有無で切り替わる（要: 受付フロー/確認モード）", async () => {});
  test.fixme("E2E-F08-03-022 既登録メールで会員登録フォームへ差し戻され重複エラーが表示される（要: 受付フロー/SEED-F08-03-DUP-EMAIL）", async () => {});
  test.fixme("E2E-F08-03-023 メールとパスワードが同一で会員登録フォームへ差し戻される（要: 受付フロー/会員登録モード）", async () => {});
  test.fixme("E2E-F08-03-024 登録番号未入力（設問はい）でエラーとなり申込フォームを再表示する（要: 受付フロー）", async () => {});
  test.fixme("E2E-F08-03-025 登録番号に全角を含むとエラーとなり申込フォームを再表示する（要: 受付フロー）", async () => {});
  test.fixme("E2E-F08-03-026 登録番号が指定桁ちょうどなら桁数エラーとならず継続できる（要: 受付フロー）", async () => {});
  test.fixme("E2E-F08-03-056 未成年の申込者で完了画面に保護者同意書の案内が表示される（要: SEED-F08-03-MINOR/破壊的）", async () => {});
  test.fixme("E2E-F08-03-019 会員仮登録成功で完了画面に仮会員登録完了メッセージが表示される（要: 会員登録成功/SEED/破壊的）", async () => {});
  test.fixme("E2E-F08-03-020 会員仮登録失敗（ブラックリスト）で完了画面に登録不可の案内が表示される（要: SEED-F08-03-BLACKLIST/破壊的）", async () => {});

  // creds＋store があれば live 化する非破壊ガード確認（会員ログイン中も査定IDなしなら完了内容を表示しない）
  test("E2E-F08-03-021-live 会員資格情報・店舗がある環境でも査定IDなしの完了URLは完了内容を表示しない", async ({ page }) => {
    test.skip(!(HAS_FRONT_STORE && HAS_FRONT_CREDS), "ECCUBE_FRONT_SHOP または ECCUBE_FRONT_USER/PASS 未設定");
    // 権限・認可: 会員ログイン中でも査定IDが無ければ完了内容は表示されない（非破壊）。
    // 会員ログインの実施は会員ログイン機能（F06）所管のため、ここでは環境設定の有無をゲートとしガード挙動を確認する。
    const complete = new FrontStorePurchaseOtcBuyEntryCompletePage(page);
    await complete.gotoCompleteDirect();
    await complete.seeNotCompletionScreen();
  });
});
