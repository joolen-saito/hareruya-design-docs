/**
 * F08-05（店頭買取の申込→管理画面での確認）の、会員としてログインした申込を「変更せずに」進める部品。
 * 既存の applyAsMember（pages/front/m06_otc_buy.ts）は入力欄を全部入れ直すので、会員情報をそのまま使う手順には使えない。
 */
import { expect, Page } from "@playwright/test";
import { 申込前ログイン画面 } from "./m06_otc_buy";

const OPEN = 30_000;

export class MemberApplyPage {
  constructor(readonly page: Page) {}

  private readonly field = (name: string) => this.page.locator(`[name="otc_buy_order[${name}]"]`);

  /** 申込前ログイン画面を開く */
  async 申込前ログイン画面を開く(支店URL: string): Promise<void> {
    await this.page.goto(申込前ログイン画面(支店URL), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }

  /** 申込前ログイン画面でログインし、申込情報入力画面へ移る */
  async ログインする(メール: string, パスワード: string): Promise<void> {
    const form = this.page.locator("form#login_otc_buy");
    await form.locator('input[name="login_email"]').fill(メール, { timeout: OPEN });
    await form.locator('input[name="login_pass"]').fill(パスワード, { timeout: OPEN });
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+(\?|$)/, { timeout: 60_000 }), form.locator('button[type="submit"]').dispatchEvent("click")]);
    await this.page.waitForLoadState("load");
  }

  /** 申込情報入力画面に設定されている申込者の姓・名 */
  async 申込者の姓名(): Promise<{ 姓: string; 名: string }> {
    await expect(this.field("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible({ timeout: OPEN });
    return { 姓: await this.field("lastName").inputValue({ timeout: OPEN }), 名: await this.field("firstName").inputValue({ timeout: OPEN }) };
  }

  /** 何も変更せず、利用規約同意するにチェックを入れて「次のページへ進む」を押す（確認画面へ移る） */
  async 同意して次へ進む(): Promise<void> {
    await this.page.locator('input[name="otc_buy_order[privacy_flg]"]').check({ timeout: OPEN });
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+\/confirm/, { timeout: 60_000 }), this.page.locator("button#otcBuyOrderApply").click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 確認画面の「査定申込み」を押し、完了画面（査定申込みが完了しました）まで進める */
  async 査定申込みする(): Promise<void> {
    const apply = this.page.locator("button#otcBuyOrderApply");
    await expect(apply, "申込確認画面の「査定申込み」ボタン").toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+\/complete/, { timeout: 60_000 }), apply.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  readonly 完了の表示 = () => this.page.getByText("査定申込みが完了しました。");
}
