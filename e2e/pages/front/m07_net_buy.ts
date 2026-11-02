/**
 * フロントのネット買取の申込（買取商品詳細 → 買取カート → 買取手続き → 申込み）。M07 の買取情報を作る元の操作。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 買取商品詳細（/ja/purchase/detail/<商品ID>）の「カートに追加」で買取カートに入れ、買取カート（/ja/purchase/cart）の「買取手続きへ」で買取手続き（/ja/purchase/fill）へ移る。
 * - 買取手続きの「申込み」を押すと確認のモーダルが出て、モーダルの「申込み」で確定する。完了画面に買取番号が出る。
 * - 申込みにはフロントのログインが要る（会員でなければ申込めない）。
 */
import { expect, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 買取できる商品の候補 } from "../../db/m07";

const front = (p: string) => `${BASE_URL}/ja${p}`;
const OPEN = 30_000;

export type 買取会員 = { メール: string; パスワード: string };

/** フロントにログインする（マイページのログイン画面） */
export async function ログインする(page: Page, m: 買取会員): Promise<void> {
  await page.goto(front("/mypage/login"), { timeout: 60_000 });
  await page.waitForLoadState("domcontentloaded");
  const form = page.locator("form#login_mypage");
  await expect(form, "フロントのログイン画面").toBeVisible({ timeout: OPEN });
  await form.locator('input[name="login_email"]').fill(m.メール, { timeout: OPEN });
  await form.locator('input[name="login_pass"]').fill(m.パスワード, { timeout: OPEN });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
    form.locator('button[type="submit"]').dispatchEvent("click"),
  ]);
  if (/\/mypage\/login/.test(page.url())) throw new Error(`フロントにログインできない（${m.メール}）`);
}

let usable: string | null = null;

/** 買取商品詳細が開け、カートに入れて買取手続きへ進める（買取価格500円以上の）商品ID。最初に見つけたものを使い回す */
export async function 買取する商品を選ぶ(member: Page): Promise<string> {
  if (usable) return usable;
  // 確かめ用のカートが会員のカートに残らないよう、別の未ログインのブラウザで確かめる
  const ctx = await member.context().browser()!.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  try {
  for (const id of 買取できる商品の候補(30)) {
    const res = await page.goto(front(`/purchase/detail/${id}`), { timeout: 60_000 });
    await page.waitForLoadState("load");
    if ((res?.status() ?? 0) >= 400 || (await page.locator("button.addCart.detail").count()) === 0) continue;
    await カートに入れる(page, id);
    await page.goto(front("/purchase/cart"), { timeout: 60_000 });
    await page.waitForLoadState("load");
    if (await page.locator("button.js-purchase-cart-proceed").waitFor({ state: "visible", timeout: 5_000 }).then(() => true, () => false)) { usable = id; return id; }
  }
  } finally { await ctx.close(); }
  throw new Error("買取価格500円以上で、カートに入れて買取手続きへ進める商品が見つからない");
}

/** 買取カートを空にしてから、商品を1つ入れる */
async function カートに入れる(page: Page, 商品ID: string, 数量?: string): Promise<void> {
  await page.goto(front(`/purchase/detail/${商品ID}`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const add = page.locator("button.addCart.detail").first();
  await expect(add, "買取商品詳細の「カートに追加」ボタン").toBeVisible({ timeout: OPEN });
  if (数量) {
    const qty = page.locator('input[name="quantityToBuy"]').first();
    await qty.fill(数量, { timeout: OPEN });
    await qty.blur();
  }
  const res = page.waitForResponse((r) => /\/purchase\/add$/.test(new URL(r.url()).pathname) && r.request().method() === "POST", { timeout: 30_000 });
  await add.click({ timeout: OPEN });
  const r = await res;
  expect(r.status(), "買取カートへ追加する要求の応答").toBe(200);
}

/**
 * 会員としてログイン済みのページで、買取の申込みを1回行う。完了画面の買取番号（PU日付-10桁の番号）の番号部分（数字）を返す。
 * 買取手続きの必須項目には有効な値を入れる（正本が値を決めていない）。
 */
export async function 申込む(page: Page, 商品ID: string, 条件?: { 箱数?: string; 数量?: string }): Promise<string> {
  await カートに入れる(page, 商品ID, 条件?.数量);
  await page.goto(front("/purchase/cart"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const proceed = page.locator("button.js-purchase-cart-proceed");
  await expect(proceed, "買取カートの「買取手続きへ」ボタン").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/purchase\/(fill|login)/, { timeout: 60_000 }), proceed.dispatchEvent("click")]);
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`[name="purchase_confirm[${name}]"]`);
  await expect(f("bankCode"), "買取手続き画面の銀行名の欄").toBeVisible({ timeout: OPEN });
  await f("bankCode").fill("試験銀行", { timeout: OPEN });
  await f("branchCode").fill("試験支店", { timeout: OPEN });
  await page.locator('input[name="purchase_confirm[accountTypeId]"]').first().check({ timeout: OPEN });
  await f("accountNo").fill("1234567", { timeout: OPEN });
  await f("accountHolder").fill("ハレルヤ タロウ", { timeout: OPEN });
  if ((await f("packageCount").count()) > 0) {
    const opts = await f("packageCount").locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
    await f("packageCount").selectOption(条件?.箱数 ?? opts[0], { timeout: OPEN });
  }
  await page.locator('input[name="purchase_confirm[autoApprovalFlg]"]').first().check({ timeout: OPEN });
  if ((await f("job").count()) > 0) await f("job").selectOption({ index: 1 }, { timeout: OPEN });
  if ((await f("birth][year").count()) > 0) {
    await f("birth][year").selectOption("1990", { timeout: OPEN });
    await f("birth][month").selectOption("1", { timeout: OPEN });
    await f("birth][day").selectOption("1", { timeout: OPEN });
  }
  await page.locator("#isQualifiedInvoiceIssuer_false").check({ timeout: OPEN });
  await page.locator("#confirm-purchase").check({ timeout: OPEN });
  const submit = page.locator("#purchase-confirm-button");
  await expect(submit, "買取手続き画面の「申込み」ボタン").toBeEnabled({ timeout: OPEN });
  await submit.click({ timeout: OPEN });
  const modalSubmit = page.locator("#purchase-confirm-modal [data-js-confirm-modal-submit]");
  await expect(modalSubmit, "確認モーダルの「申込み」ボタン").toBeVisible({ timeout: OPEN });
  await Promise.all([page.waitForURL(/\/purchase\/complete/, { timeout: 90_000 }), modalSubmit.click({ timeout: OPEN })]);
  await page.waitForLoadState("load");
  const body = (await page.locator("body").innerText({ timeout: OPEN })).replace(/\s+/g, " ");
  const m = /PU\d{6}-(\d{10})/.exec(body);
  if (!m) throw new Error(`買取の申込完了の画面に買取番号が無い（${body.slice(0, 200)}）`);
  return String(Number(m[1]));
}
