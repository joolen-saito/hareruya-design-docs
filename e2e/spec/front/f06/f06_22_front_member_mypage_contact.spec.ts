/**
 * フロント「お問い合わせ送信」（F06-22）E2E。
 * integration_test/e2e/f06_22_front_member_mypage_contact_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-22_front_member_mypage_contact.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 会員資格情報は ECCUBE_FRONT_USER/PASS（未設定時は要ログインケースを test.skip）。
 *
 * 破壊的操作の扱い: mode=complete（送信をする）はお問い合わせメールを送信し dtb_contact に保存する不可逆な
 * 副作用を伴うため live では走らせない。非破壊（お問い合わせ画面の表示・案内文・必須未入力で確認画面へ
 * 進めない・会員の初期表示）のみ live（要ログインは test.skip）。送信確定・完了画面到達・会員紐づけ・
 * 件名マスタ依存の確認遷移・イベントキャンセルは test.fixme（理由付き）で保留。メール実受信は手動/対象外。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberContactPage } from "../../../pages/front/f06/f06_22_front_member_mypage_contact.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 会員 > お問い合わせ送信", { tag: ["@front", "@member"] }, () => {
  // --- 非破壊・ログイン不要（資格情報/シード不要で走る live） ---
  test("E2E-F06-22-007 お問い合わせ画面にフォーム（メール・内容・確認画面へ）が表示される", async ({ page }) => {
    const contact = new FrontMemberContactPage(page);
    await contact.gotoContact();
    await contact.seeContactForm();
  });

  test("E2E-F06-22-012 お問い合わせ画面に見出し「お問い合わせ」と案内文が表示される", async ({ page }) => {
    const contact = new FrontMemberContactPage(page);
    await contact.gotoContact();
    await expect(contact.body).toContainText("お問い合わせ");
    await expect(contact.body).toContainText("当店へのご要望は、下記フォームにご記入のうえ送信してください");
  });

  test("E2E-F06-22-024 必須未入力で「確認画面へ」を押しても確認画面へ進まず入力画面に留まる", async ({ page }) => {
    const contact = new FrontMemberContactPage(page);
    await contact.gotoContact();
    await contact.confirmButton.click();
    // 検証エラーにより入力画面を再表示（同一URL /contact に留まる。確認画面へ進まない）。
    await expect(page).toHaveURL(/\/contact(?:\/|\?|$)/);
    await expect(page).not.toHaveURL(/\/contact\/complete/);
    await expect(contact.confirmButton).toBeVisible();
  });

  // --- 要ログイン・非破壊（会員情報の初期表示）。creds が無い環境は skip ---
  test("E2E-F06-22-036 ログイン会員でお問い合わせ画面を開くと会員情報が初期表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const contact = new FrontMemberContactPage(page);
    await contact.login();
    await contact.gotoContact();
    // 会員のメールアドレスが初期表示される（原値は環境依存のため非空で判定）。
    await expect(contact.emailInput).toBeVisible();
    expect((await contact.emailInput.inputValue()).trim()).not.toBe("");
  });

  // --- 破壊的（メール送信・保存）／要件名マスタ・イベント・会員シード。live では走らせず fixme で保留 ---
  test.fixme("E2E-F06-22-008 妥当な入力で「確認画面へ」→確認画面が表示される（要: 件名マスタシード）", async () => {});
  test.fixme("E2E-F06-22-010 確認画面の「戻る」で入力画面へ戻る（要: 件名マスタシード/確認遷移）", async () => {});
  test.fixme("E2E-F06-22-013 件名選択に応じて付帯情報欄・店舗欄の表示が切り替わる（要: 件名マスタシード）", async () => {});
  test.fixme("E2E-F06-22-018 イベントキャンセルで必須未入力時はアラート警告で送信を中止する（要: イベント/件名シード）", async () => {});
  test.fixme("E2E-F06-22-009 確認画面で「送信をする」→お問い合わせ完了画面へ遷移する（破壊的: メール送信/保存・要件名マスタ）", async () => {});
  test.fixme("E2E-F06-22-011 送信後にお問い合わせ完了画面が表示される（破壊的: 送信到達・要件名マスタ）", async () => {});
  test.fixme("E2E-F06-22-020 ログイン会員の送信でお問い合わせに当該会員が紐づく（破壊的: 送信/保存・要ログイン/DB確認）", async () => {});
  test.fixme("E2E-F06-22-064 未ログインでメールから会員特定不可のときは会員紐づけなしで保存される（破壊的: 送信/保存・DB確認）", async () => {});
  test.fixme("E2E-F06-22-057 送信でお問い合わせ内容が dtb_contact に登録される（破壊的: 送信/保存・DB確認・要件名マスタ）", async () => {});
  test.fixme("E2E-F06-22-074 送信成功でメール送信・内容保存・完了遷移の副作用が生じる（破壊的: メール送信/保存・要件名マスタ）", async () => {});
});
