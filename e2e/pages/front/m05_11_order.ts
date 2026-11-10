/**
 * M05-11 受注情報編集のシードが使う、フロント（本店のサイト）での会員の注文。
 * シード表の文:「フロントの店舗Aの画面にこの会員でログインし、店舗Aで販売中（公開・在庫あり）の任意の商品を数量1でカートに入れ、
 * ご注文手続き画面で配送方法「宅配便」、お支払方法「銀行振込」を選び、ポイントを使わずに注文を確定する」
 *
 * 配送方法「宅配便」が手元のDBに無いときは、出荷指示リストから除外されない配送方法の先頭を選ぶ（シードでの解釈。注記に残す）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { BASE_URL, ENV_NAME, MAIL_URL, SETUP_ADMIN } from "../../config/env";
import { 販売中の商品ID } from "../../db/m05_front_order";
import { hideDebugToolbar, withAdminSession } from "../../lib/session";
import { customerStateByEmail } from "../admin/customer";
import { clearCart, frontLogin } from "../admin/m04_19_order_shortage";
import { FrontMember, registerFrontMember } from "./member_entry";

const front = (p: string) => `${BASE_URL}/ja${p}`;
const EXCLUDED_DELIVERIES = ["店頭受取", "スムーズ店頭受取", "晴れる屋定期便"];

export type 注文の明細 = { 商品ID: string; 数量: number };

/** 販売中の商品（手元のDBにある公開・在庫ありの商品）。n点ぶん、重ならない商品IDを返す */
export function 販売中の商品(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(販売中の商品ID(out));
  return out;
}

/** 会員を本会員として用意する（会員一覧で本会員なら何もしない。いなければフロントの会員登録画面で登録し、本登録のメールを読む） */
export async function 会員を用意する(browser: Browser, m: FrontMember): Promise<void> {
  const state = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, m.メール));
  if (state === "本会員") return;
  if (state === "仮会員") throw new Error(`試験用の会員 ${m.メール} が仮会員のまま。本登録のメールのURLを開いて本会員にしてから流す`);
  if (!MAIL_URL) throw new Error(`E2E_ENV=${ENV_NAME} では試験用の会員を登録できない（本登録のメールを読めない。E2E_MAIL_URL を与える）`);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), m);
  } finally {
    await context.close();
  }
  const after = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, m.メール));
  if (after !== "本会員") throw new Error(`試験用の会員 ${m.メール} を登録したが、会員一覧で本会員にならない（${after ?? "見つからない"}）`);
}

async function カートに入れる(page: Page, 商品ID: string, 数量: number, what: string): Promise<void> {
  await page.goto(front(`/products/detail/${商品ID}`));
  await page.waitForLoadState("load");
  const form = page.locator(`form#productForm${商品ID}`);
  await expect(form, `${what}: 商品詳細の画面（商品ID ${商品ID}）`).toHaveCount(1);
  const table = form.locator('[id^="priceTable-"]:visible');
  await expect(table, `${what}: 商品詳細の価格・在庫の表`).toHaveCount(1);
  const qty = table.locator("tbody tr .qty-label:visible").first();
  await expect(qty, `${what}: 数量を入れられる規格の行`).toBeVisible();
  await qty.fill(String(数量));
  await qty.blur();
  await expect(qty.locator("xpath=ancestor::tr[1]").locator(".qty-input"), `${what}: 入れた数量が送信用の欄へ写る`).toHaveValue(String(数量));
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/products/add_cart/${商品ID}`) && r.request().method() === "POST"),
    form.locator("button.add-cart").dispatchEvent("click"),
  ]);
  if (res.status() >= 400) throw new Error(`${what}: カートへの追加の応答が ${res.status()}`);
  const body = await res.json().catch(() => null) as { done?: boolean; messages?: string[] } | null;
  if (body && body.done === false) throw new Error(`${what}: カートに入れられない: ${(body.messages ?? []).join(" / ")}`);
}

/** ご注文手続きで配送方法と支払方法（銀行振込）を選び、注文を確定する。注文番号と選んだ配送方法を返す */
async function 確定する(page: Page, 配送方法: string, what: string, 支払候補: string[] = ["銀行振込"]): Promise<{ 注文番号: string; 配送方法: string; 支払方法: string }> {
  await page.goto(front("/cart"));
  await page.waitForLoadState("load");
  const toShopping = page.locator("a.p-hareruya-cart__checkout-btn");
  await expect(toShopping, `${what}: カートの「購入手続きへ」`).toHaveCount(1);
  await Promise.all([page.waitForURL(/\/shopping(\?.*)?$/, { waitUntil: "domcontentloaded" }), toShopping.click()]);
  await page.waitForLoadState("load");

  let 選んだ配送 = 配送方法;
  const dsel = 'input[name="_shopping_order[Shippings][0][Delivery]"]';
  if ((await page.locator(dsel).count()) > 0) {
    const ds = await page.locator(dsel).evaluateAll((nodes) => nodes.map((n) => ({
      value: (n as HTMLInputElement).value, checked: (n as HTMLInputElement).checked,
      label: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    })));
    const pick = ds.find((d) => d.label === 配送方法) ?? ds.find((d) => d.label === "ゆうパック") ?? ds.find((d) => !EXCLUDED_DELIVERIES.some((e) => d.label.includes(e)));
    if (!pick) throw new Error(`${what}: 配送方法の選択肢が無い（${ds.map((d) => d.label).join("、")}）`);
    選んだ配送 = pick.label;
    if (!pick.checked) {
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator(`${dsel}[value="${pick.value}"]`).check({ force: true })]);
      await page.waitForLoadState("load");
    }
  }

  const radios = page.locator('input[name="_shopping_order[Payment]"]');
  await expect(radios.first(), `${what}: 支払方法の選択肢`).toBeAttached();
  const choices = await radios.evaluateAll((nodes) => nodes.map((n) => ({
    value: (n as HTMLInputElement).value, checked: (n as HTMLInputElement).checked,
    label: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim(),
  })));
  // 支払候補に「*」があれば、その会員で選べる支払方法の先頭を選ぶ（会員グループごとに選べる支払方法が違うとき）
  const pay = 支払候補.includes("*") ? choices[0] : 支払候補.map((l) => choices.find((c) => c.label === l)).find(Boolean);
  if (!pay) throw new Error(`${what}: 支払方法に「${支払候補.join("・")}」が無い（${choices.map((c) => c.label).join("、")}）`);
  if (!pay.checked) {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator(`input[name="_shopping_order[Payment]"][value="${pay.value}"]`).check({ force: true })]);
    await page.waitForLoadState("load");
  }
  const accept = page.locator('input[name="_shopping_order[accept_order]"]');
  await expect(accept, `${what}: 「この内容で注文を確定します。」`).toHaveCount(1);
  await accept.check({ force: true });
  const submit = page.locator("button[data-js-payment-submit]");
  await expect(submit, `${what}: 注文のボタンが押せる`).toBeEnabled();
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), submit.click()]);
  await page.waitForLoadState("load");
  if (!/\/shopping\/complete/.test(page.url())) {
    const errors = (await page.locator(".p-hareruya-message-box--error, .ec-alert-warning, .error, .c-hareruya-form-input__field-error--server").allTextContents())
      .map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    throw new Error(`${what}: 注文が確定しない（${page.url()}）: ${errors.join(" / ") || "画面にエラーの表示なし"}`);
  }
  const heading = page.getByText(/ご注文番号\s*\S+/).first();
  await expect(heading, `${what}: ご注文完了の画面のご注文番号`).toBeVisible();
  const m = /ご注文番号\s*(\S+)/.exec((await heading.textContent()) ?? "");
  if (!m) throw new Error(`${what}: ご注文番号を読めない`);
  return { 注文番号: m[1], 配送方法: 選んだ配送, 支払方法: pay.label };
}

/** 会員でフロントにログインし、明細をカートに入れて、銀行振込・ポイントを使わずに注文する */
export async function 会員が注文する(browser: Browser, m: FrontMember, 明細: 注文の明細[], what: string, opt: { 配送?: string; 支払候補?: string[] } = {}): Promise<{ 注文番号: string; 配送方法: string; 支払方法: string }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    await frontLogin(page, m);
    await clearCart(page, () => undefined);
    for (const it of 明細) await カートに入れる(page, it.商品ID, it.数量, `${what}: 商品をカートに入れる`);
    return await 確定する(page, opt.配送 ?? "宅配便", `${what}: 注文`, opt.支払候補);
  } finally {
    await context.close();
  }
}
