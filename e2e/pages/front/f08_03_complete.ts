/**
 * F08-03 店頭買取査定申込登録確認～完了の、完了画面の読み取りと、未成年の確認つきの「次のページへ進む」。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのテンプレートで確かめた。期待値はここから取らない）:
 * - 完了画面（/<言語>/otcbuy/<支店URL>/complete）は、見出しの下に申込者（日本語表示は「姓 名 様」、英語表示は敬称なし）と査定番号を出す。
 *   「査定番号 …」（英語は「Assessment Number …」）。画面の上部に会員登録の結果の案内（仮会員登録の完了・会員登録できなかった旨）が出ることがある。
 *   仮会員登録の案内の領域は、会員登録を伴う申込みで登録できたときだけ出る。未成年の申込みには保護者同意書の案内の枠が出る。
 *   下部に「査定申込みへ戻る」のリンクと、「※N秒後に自動で査定申込みへ遷移します」の文がある。
 * - 申込情報入力画面で未成年の生年月日のまま「次のページへ進む」を押すと、確認のモーダル（はい・いいえ）が出る。
 */
import { expect, Locator, Page } from "@playwright/test";
import { OtcInputPage } from "./f08_02_input";

const T = 30_000;

export class OtcCompletePage {
  constructor(readonly page: Page) {}

  readonly 完了の枠 = (): Locator => this.page.locator(".p-hareruya-satei-complete");
  readonly 仮会員登録完了の案内 = (): Locator => this.page.locator(".p-hareruya-satei-complete__register");
  /** 画面の上部の会員登録の結果の案内の枠（未成年の案内の枠は含めない） */
  readonly 上部の案内の枠 = (): Locator => this.page.locator(".p-hareruya-satei-complete__inner > .p-hareruya-message-box--error:not(.u-hareruya-mt15)");
  readonly 保護者同意書の案内 = (): Locator =>
    this.page.locator(".p-hareruya-satei-complete__inner > .p-hareruya-message-box--error.u-hareruya-mt15").filter({ hasText: /保護者同意書|written consent/ });
  readonly 身分証明書の案内 = (): Locator => this.page.locator(".p-hareruya-satei-complete").getByText("身分証明書");
  readonly 査定申込みへ戻るのリンク = (): Locator => this.page.locator(".p-hareruya-satei-complete__actions a.c-hareruya-btn");

  /** 完了画面が表示されていること */
  async 表示を待つ(): Promise<void> {
    await expect(this.完了の枠(), "店頭買取査定申込登録完了画面").toBeVisible({ timeout: T });
  }

  /** 完了画面の申込者の表示（空白は1つにそろえる） */
  async 申込者(): Promise<string> {
    return (await this.page.locator(".p-hareruya-satei-complete__customer-name").innerText({ timeout: T })).replace(/\s+/g, " ").trim();
  }

  /** 完了画面の査定番号（「査定番号」「Assessment Number」に続く値）。欄が無ければ null */
  async 査定番号(): Promise<string | null> {
    const el = this.page.locator(".p-hareruya-satei-complete__customer .c-hareruya-heading--lev1").first();
    if ((await el.count()) === 0) return null;
    const m = /(?:査定番号|Assessment Number)\s*(\S+)/.exec((await el.innerText({ timeout: T })).replace(/\s+/g, " "));
    return m ? m[1] : null;
  }

  /** 画面の上部の会員登録の結果の案内の文（空白は除く）。無ければ空 */
  async 上部の案内の文(): Promise<string> {
    const box = this.上部の案内の枠();
    if ((await box.count()) === 0) return "";
    return (await box.first().innerText({ timeout: T })).replace(/\s+/g, "");
  }

  /** 完了画面の「※N秒後に自動で…」の N（読めなければ null） */
  async 自動遷移の秒数(): Promise<number | null> {
    const t = await this.page.locator(".p-hareruya-satei-complete__actions p").first().innerText({ timeout: T });
    const m = /(\d+)\s*(?:秒後|seconds)/.exec(t);
    return m ? Number(m[1]) : null;
  }

  /** 完了画面から申込前ログイン画面へ自動で移るのを待つ（秒数に余裕を足して待つ） */
  async 自動遷移を待つ(秒: number): Promise<void> {
    await this.page.waitForURL(/\/otcbuy\/\w+\/entry/, { timeout: (秒 + 15) * 1000 });
    await this.page.waitForLoadState("load");
  }

  /** 「査定申込みへ戻る」を押し、申込前ログイン画面へ移る */
  async 査定申込みへ戻る(): Promise<void> {
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+\/entry/, { timeout: 60_000 }), this.査定申込みへ戻るのリンク().click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
}

/**
 * 申込情報入力画面の「次のページへ進む」を押す。未成年の確認のモーダルが出たら「はい」を押す。
 * 移った先のパスと、確認のモーダルが出たかを返す。
 */
export async function 未成年の確認つきで次へ進む(page: Page, i: OtcInputPage): Promise<{ パス: string; 確認あり: boolean }> {
  const btn = i.入力フォーム().locator("button#otcBuyOrderApply");
  await expect(btn, "申込情報入力画面の「次のページへ進む」").toBeVisible({ timeout: T });
  await btn.click({ timeout: T });
  const modal = i.未成年確認モーダル();
  await Promise.race([
    modal.waitFor({ state: "visible", timeout: 20_000 }),
    page.waitForURL(/\/otcbuy\/\w+\/(register_customer|confirm)/, { timeout: 20_000 }),
  ]).catch(() => undefined);
  let 確認あり = false;
  if (await modal.isVisible()) {
    確認あり = true;
    await i.未成年確認のはいを押す();
  }
  await page.waitForLoadState("load");
  return { パス: i.パス, 確認あり };
}
