/**
 * フロントの店頭買取査定申込（M06 の買取の元になる申込）と、マイページの買取履歴。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 店頭買取査定申込前ログイン画面（/ja/otcbuy/<支店URL>/entry）の「アカウントをお持ちでない方はこちら」で申込情報入力へ。
 * - 申込情報入力の「次のページへ進む」は、会員登録の画面（メール・パスワード欄と「会員登録をスキップする」）へ移る。
 *   スキップを押すと確認画面、確認画面の「査定申込み」で完了画面（査定番号を表示）へ移る。
 * - 会員としてログインしている申込は、情報入力の「次のページへ進む」が直接確認画面へ移る。
 * - 国・郵便番号・電話番号の組み立ては画面のスクリプトが送信時に行う。
 */
import { expect, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const front = (p: string) => `${BASE_URL}/ja${p}`;

export type 申込者 = { 姓: string; 名: string; セイ: string; メイ: string };

export const 申込前ログイン画面 = (支店URL: string) => front(`/otcbuy/${支店URL}/entry`);

const OPEN = 30_000;

/** 申込情報入力の画面で、必須項目を入れる（正本の「残りの必須項目に有効な値」は固定の値にした） */
async function fillApplication(page: Page, a: 申込者): Promise<void> {
  const f = (name: string) => page.locator(`[name="otc_buy_order[${name}]"]`);
  await expect(f("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible({ timeout: OPEN });
  await f("lastName").fill(a.姓, { timeout: OPEN });
  await f("firstName").fill(a.名, { timeout: OPEN });
  await f("lastNameKana").fill(a.セイ, { timeout: OPEN });
  await f("firstNameKana").fill(a.メイ, { timeout: OPEN });
  // 国は日本のまま（郵便番号は上3桁・下4桁の欄）
  await f("postal_code_1").fill("169", { timeout: OPEN });
  await f("postal_code_2").fill("0075", { timeout: OPEN });
  // 郵便番号の欄を離れると、画面のスクリプトが住所を自動で入れる（遅れて届き、あとの入力を上書きすることがある）。落ち着いてから残りを入れる
  await f("postal_code_2").blur();
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
  await page.waitForTimeout(1500);
  await f("pref").selectOption({ label: "東京都" }, { timeout: OPEN });
  await f("addr01").fill("新宿区高田馬場", { timeout: OPEN });
  await f("addr02").fill("3-12-2", { timeout: OPEN });
  await f("birth][year").selectOption("1990", { timeout: OPEN });
  await f("birth][month").selectOption("1", { timeout: OPEN });
  await f("birth][day").selectOption("1", { timeout: OPEN });
  await f("tel01").fill("03", { timeout: OPEN });
  await f("tel02").fill("5332", { timeout: OPEN });
  await f("tel03").fill("7517", { timeout: OPEN });
  await f("job").selectOption({ index: 1 }, { timeout: OPEN });
  await page.locator('input[name="otc_buy_order[call_flg]"][value="0"]').check({ timeout: OPEN });
  await page.locator('input[name="otc_buy_order[playing_flg]"][value="0"]').check({ timeout: OPEN });
  await page.locator('input[name="otc_buy_order[qualifiedInvoiceIssuerFlg]"][value="0"]').check({ timeout: OPEN });
  await page.locator('input[name="otc_buy_order[privacy_flg]"]').check({ timeout: OPEN });
  // 自動で入る住所が遅れて届いても入力が壊れていないこと（壊れていれば入れ直す）
  await page.waitForTimeout(500);
  for (const [name, value] of [["addr01", "新宿区高田馬場"], ["addr02", "3-12-2"], ["tel01", "03"], ["tel02", "5332"], ["tel03", "7517"]] as const) {
    if ((await f(name).inputValue({ timeout: OPEN })) !== value) await f(name).fill(value, { timeout: OPEN });
  }
}

/** 確認画面の「査定申込み」で申込を確定し、完了画面の査定番号を返す */
async function confirmAndComplete(page: Page): Promise<string> {
  const apply = page.locator("button#otcBuyOrderApply");
  await expect(apply, "申込確認画面の「査定申込み」ボタン").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/complete/, { timeout: 60_000 }), apply.click({ timeout: OPEN })]);
  await expect(page.getByText("査定申込みが完了しました。"), "申込完了の表示").toBeVisible({ timeout: OPEN });
  const text = (await page.getByText(/査定番号\s*\S+/).first().innerText({ timeout: OPEN })).replace(/\s+/g, " ");
  const m = /査定番号\s*(\S+)/.exec(text);
  if (!m) throw new Error(`申込完了の画面に査定番号が無い（${text}）`);
  return m[1];
}

/** 会員登録なしで申込む（申込前ログイン画面 → 「アカウントをお持ちでない方はこちら」→ 情報入力 → 会員登録をスキップ → 確認 → 完了）。完了画面の査定番号を返す */
export async function applyAsGuest(page: Page, 支店URL: string, a: 申込者): Promise<string> {
  await page.goto(申込前ログイン画面(支店URL), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await page.getByRole("link", { name: "アカウントをお持ちでない方はこちら" }).click({ timeout: OPEN });
  await page.waitForLoadState("load");
  await fillApplication(page, a);
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/register_customer/, { timeout: 60_000 }), page.locator("button#otcBuyOrderApply").click({ timeout: OPEN })]);
  await page.waitForLoadState("load");
  const skip = page.getByRole("link", { name: "会員登録をスキップする" });
  await expect(skip, "会員登録の画面の「会員登録をスキップする」").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/confirm/, { timeout: 60_000 }), skip.click({ timeout: OPEN })]);
  await page.waitForLoadState("load");
  return confirmAndComplete(page);
}

/** 会員としてログインして申込む（申込前ログイン画面でログイン → 情報入力 → 確認 → 完了）。完了画面の査定番号を返す */
export async function applyAsMember(page: Page, 支店URL: string, 会員: { メール: string; パスワード: string }, a: 申込者): Promise<string> {
  await page.goto(申込前ログイン画面(支店URL), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const form = page.locator("form#login_otc_buy");
  await form.locator('input[name="login_email"]').fill(会員.メール, { timeout: OPEN });
  await form.locator('input[name="login_pass"]').fill(会員.パスワード, { timeout: OPEN });
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+(\?|$)/, { timeout: 60_000 }), form.locator('button[type="submit"]').dispatchEvent("click")]);
  await page.waitForLoadState("load");
  await fillApplication(page, a);
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/confirm/, { timeout: 60_000 }), page.locator("button#otcBuyOrderApply").click({ timeout: OPEN })]);
  await page.waitForLoadState("load");
  return confirmAndComplete(page);
}

/** マイページの買取履歴一覧と、店頭買取の買取履歴詳細 */
export class PurchaseHistoryPage {
  constructor(readonly page: Page) {}

  /** 買取履歴一覧を開く */
  async openList(): Promise<void> {
    const res = await this.page.goto(front("/mypage/purchase_history"), { timeout: 60_000 });
    expect(res?.status() ?? 0, "買取履歴一覧画面の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
  }

  /** 一覧の先頭（新しい順）の買取番号 */
  async 最新の買取番号(): Promise<string> {
    const link = this.page.locator("a.c-hareruya-link").first();
    await expect(link, "買取履歴一覧の先頭の買取番号").toBeVisible({ timeout: OPEN });
    return (await link.innerText({ timeout: OPEN })).trim();
  }

  /** 一覧の、買取番号の行の「処理状態」「買取金額合計」の表示 */
  async 一覧の行(買取番号: string): Promise<{ 処理状態: string; 買取金額合計: string }> {
    const box = this.page.locator(`.p-hareruya-history-list__box[aria-label="買取番号 ${買取番号}"]`);
    await expect(box, `買取履歴一覧の買取番号「${買取番号}」の行`).toBeVisible({ timeout: OPEN });
    const val = async (見出し: string) => (await box.locator(".p-hareruya-history-list__order-info-row").filter({ has: this.page.locator("dt", { hasText: 見出し }) }).locator("dd").first().innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
    return { 処理状態: await val("処理状態"), 買取金額合計: await val("買取金額合計") };
  }

  /** 買取番号のリンクを押して買取履歴詳細画面を開く */
  async openDetail(買取番号: string): Promise<void> {
    const link = this.page.getByRole("link", { name: 買取番号, exact: true }).first();
    await expect(link, `買取履歴一覧の買取番号「${買取番号}」のリンク`).toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 詳細の項目（見出し → 値）。見出しは「処理状態」「成立日」など */
  async detailValue(見出し: string): Promise<string> {
    const dt = this.page.locator("dt").filter({ hasText: 見出し }).first();
    await expect(dt, `買取履歴詳細の「${見出し}」`).toBeVisible({ timeout: OPEN });
    return (await dt.locator("xpath=following-sibling::dd[1]").innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
  }
}
