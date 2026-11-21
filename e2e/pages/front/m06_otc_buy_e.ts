/**
 * フロントの店頭買取査定申込（会員登録なし）のうち、職業と適格請求書発行事業者の登録番号を指定して申込むもの（2026-11-21。M06-02 の追加シードが使う）。
 * pages/front/m06_otc_buy.ts の申込（職業は選択肢の先頭・事業者でない）と同じ操作で、その2項目だけを指定する。既存の部品は変えず、同じ入力を写した。
 */
import { Browser, expect, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar } from "../../lib/session";
import { 申込者, 申込前ログイン画面 } from "./m06_otc_buy";

const OPEN = 30_000;

export type 申込の指定 = { 職業: string; 事業者番号: string };

async function 入力する(page: Page, a: 申込者, 指定: 申込の指定): Promise<void> {
  const f = (name: string) => page.locator(`[name="otc_buy_order[${name}]"]`);
  await expect(f("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible({ timeout: OPEN });
  await f("lastName").fill(a.姓, { timeout: OPEN });
  await f("firstName").fill(a.名, { timeout: OPEN });
  await f("lastNameKana").fill(a.セイ, { timeout: OPEN });
  await f("firstNameKana").fill(a.メイ, { timeout: OPEN });
  await f("postal_code_1").fill("169", { timeout: OPEN });
  await f("postal_code_2").fill("0075", { timeout: OPEN });
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
  // 職業は、名前が「会社員」の選択肢（先頭が「選択してください」の選択肢のため、名前で選ぶ）
  await f("job").selectOption({ label: 指定.職業 }, { timeout: OPEN });
  await page.locator('input[name="otc_buy_order[call_flg]"][value="0"]').check({ timeout: OPEN });
  await page.locator('input[name="otc_buy_order[playing_flg]"][value="0"]').check({ timeout: OPEN });
  // 適格請求書発行事業者: 「はい」にして登録番号を入れる（番号の欄は「はい」にすると入力できる）
  await page.locator('input[name="otc_buy_order[qualifiedInvoiceIssuerFlg]"][value="1"]').check({ timeout: OPEN });
  const code = page.locator('input[name="otc_buy_qualified_invoice_issuer_account[qualifiedInvoiceIssuerCode]"]');
  await expect(code, "適格請求書発行事業者の登録番号の欄（入力できる）").toBeEnabled({ timeout: OPEN });
  await code.fill(指定.事業者番号, { timeout: OPEN });
  await page.locator('input[name="otc_buy_order[privacy_flg]"]').check({ timeout: OPEN });
  await page.waitForTimeout(500);
  for (const [name, value] of [["addr01", "新宿区高田馬場"], ["addr02", "3-12-2"], ["tel01", "03"], ["tel02", "5332"], ["tel03", "7517"]] as const) {
    if ((await f(name).inputValue({ timeout: OPEN })) !== value) await f(name).fill(value, { timeout: OPEN });
  }
}

/** 会員登録なしで申込む。完了画面の査定番号を返す */
async function 申込む(page: Page, 支店URL: string, a: 申込者, 指定: 申込の指定): Promise<string> {
  await page.goto(申込前ログイン画面(支店URL), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await page.getByRole("link", { name: "アカウントをお持ちでない方はこちら" }).click({ timeout: OPEN });
  await page.waitForLoadState("load");
  await 入力する(page, a, 指定);
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/register_customer/, { timeout: 60_000 }), page.locator("button#otcBuyOrderApply").click({ timeout: OPEN, noWaitAfter: true })]);
  await page.waitForLoadState("load");
  const skip = page.getByRole("link", { name: "会員登録をスキップする" });
  await expect(skip, "会員登録の画面の「会員登録をスキップする」").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/confirm/, { timeout: 60_000 }), skip.click({ timeout: OPEN, noWaitAfter: true })]);
  await page.waitForLoadState("load");
  const apply = page.locator("button#otcBuyOrderApply");
  await expect(apply, "申込確認画面の「査定申込み」ボタン").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/otcbuy\/\w+\/complete/, { timeout: 60_000 }), apply.click({ timeout: OPEN, noWaitAfter: true })]);
  await expect(page.getByText("査定申込みが完了しました。"), "申込完了の表示").toBeVisible({ timeout: OPEN });
  const text = (await page.getByText(/査定番号\s*\S+/).first().innerText({ timeout: OPEN })).replace(/\s+/g, " ");
  const m = /査定番号\s*(\S+)/.exec(text);
  if (!m) throw new Error(`申込完了の画面に査定番号が無い（${text}）`);
  return m[1];
}

/** 未ログインの新しいブラウザセッションで、職業・事業者番号を指定して申込む。完了画面の査定番号を返す */
export async function 職業と事業者番号を指定して申込む(browser: Browser, 支店URL: string, a: 申込者, 指定: 申込の指定): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    return await 申込む(page, 支店URL, a, 指定);
  } finally {
    await context.close();
  }
}
