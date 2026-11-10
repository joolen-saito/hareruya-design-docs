/**
 * M05 の各機能のシードが使う、フロント（本店のサイト）での注文。
 * シード表の文:「本店のフロント画面に登録済みの試験用会員でログインする（試験用会員が無ければ、フロントの新規会員登録画面で必須項目を入れて登録する）。
 * 商品詳細画面で販売中の商品1点を「カートに追加」し、カート画面からご注文手続き画面へ進み、お支払い方法に銀行振込以外で外部の決済画面へ移らない方法を選び、
 * ご注文内容のご確認画面で「注文する」を押す。ご注文完了画面に表示されたご注文番号を控える」
 *
 * 会員の登録は、フロントの新規会員登録画面で行い、本登録のメールは手元のメールの受け口で読む（依頼者決定 2026-10-31）。
 * 商品は手元のDBにある販売中の商品を使う（商品詳細の価格・在庫の表の、数量を入れられる先頭の規格の行）。
 * 支払方法は「代金引換」（銀行振込以外で、外部の決済画面へ移らない方法）。配送方法は、必要なら出荷指示リストから除外されないものを選ぶ。
 */
import { Browser, expect, Page } from "@playwright/test";
import { BASE_URL, ENV_NAME, MAIL_URL, SETUP_ADMIN } from "../../config/env";
import { 販売中の商品ID } from "../../db/m05_front_order";
import { hideDebugToolbar, withAdminSession } from "../../lib/session";
import { customerStateByEmail } from "../admin/customer";
import { clearCart, frontLogin } from "../admin/m04_19_order_shortage";
import { FrontMember, registerFrontMember } from "./member_entry";

const front = (p: string) => `${BASE_URL}/ja${p}`;
const PAYMENTS = ["代金引換", "郵便振替", "現金書留"];
/** 出荷指示リストから除外される配送方法（アプリの設定）。出荷指示リストに載る注文では選ばない */
const EXCLUDED_DELIVERIES = ["店頭受取", "スムーズ店頭受取", "晴れる屋定期便"];

/** 共有の試験用会員（無ければフロントの新規会員登録画面で登録する） */
export const M05_BUYER: FrontMember = {
  姓: "試験会員", 名: "受注管理購入", セイ: "シケンカイイン", メイ: "ジュチュウカンリコウニュウ",
  メール: "e2e-m05-buyer@example.test", パスワード: "Passw0rd!E2EM05",
};

let buyerReady = false;
/** 会員が本会員としていればそのまま使い、いなければ登録する（本登録のメールを読む） */
export async function ensureFrontMember(browser: Browser, m: FrontMember): Promise<void> {
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
export async function ensureBuyer(browser: Browser): Promise<void> {
  if (buyerReady) return;
  await ensureFrontMember(browser, M05_BUYER);
  buyerReady = true;
}

/** 商品詳細の画面で、数量を入れられる先頭の規格の行に1点を入れて「カートに入れる」を押す */
async function addFirstAvailable(page: Page, 商品ID: string, what: string): Promise<void> {
  await page.goto(front(`/products/detail/${商品ID}`));
  await page.waitForLoadState("load");
  const form = page.locator(`form#productForm${商品ID}`);
  await expect(form, `${what}: 商品詳細の画面（商品ID ${商品ID}）`).toHaveCount(1);
  const table = form.locator('[id^="priceTable-"]:visible');
  await expect(table, `${what}: 商品詳細の価格・在庫の表`).toHaveCount(1);
  const qty = table.locator("tbody tr .qty-label:visible").first();
  await expect(qty, `${what}: 数量を入れられる規格の行`).toBeVisible();
  await qty.fill("1");
  await qty.blur();
  const row = qty.locator("xpath=ancestor::tr[1]");
  await expect(row.locator(".qty-input"), `${what}: 入れた数量が送信用の数量の欄へ写る`).toHaveValue("1");
  const button = form.locator("button.add-cart");
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/products/add_cart/${商品ID}`) && r.request().method() === "POST"),
    button.dispatchEvent("click"),
  ]);
  if (res.status() >= 400) throw new Error(`${what}: カートへの追加の応答が ${res.status()}`);
  const body = await res.json().catch(() => null) as { done?: boolean; messages?: string[] } | null;
  if (body && body.done === false) throw new Error(`${what}: カートに入れられない: ${(body.messages ?? []).join(" / ")}`);
}

/** カートからご注文手続きへ進み、配送方法（除外されないもの）と支払方法を選んで注文を確定する。注文番号を返す */
async function checkout(page: Page, what: string, 除外されない配送: boolean): Promise<string> {
  await page.goto(front("/cart"));
  await page.waitForLoadState("load");
  const toShopping = page.locator("a.p-hareruya-cart__checkout-btn");
  await expect(toShopping, `${what}: カートの「購入手続きへ」`).toHaveCount(1);
  await Promise.all([page.waitForURL(/\/shopping(\?.*)?$/, { waitUntil: "domcontentloaded" }), toShopping.click()]);
  await page.waitForLoadState("load");

  if (除外されない配送) {
    const dsel = 'input[name="_shopping_order[Shippings][0][Delivery]"]';
    const radios = page.locator(dsel);
    if ((await radios.count()) > 0) {
      const ds = await radios.evaluateAll((nodes) => nodes.map((n) => ({
        value: (n as HTMLInputElement).value, checked: (n as HTMLInputElement).checked,
        label: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      })));
      const okNow = ds.find((d) => d.checked && !EXCLUDED_DELIVERIES.some((e) => d.label.includes(e)));
      if (!okNow) {
        const pick = ds.find((d) => !EXCLUDED_DELIVERIES.some((e) => d.label.includes(e)));
        if (!pick) throw new Error(`${what}: 出荷指示リストから除外されない配送方法が無い（ある選択肢: ${ds.map((d) => d.label).join("、")}）`);
        await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator(`${dsel}[value="${pick.value}"]`).check({ force: true })]);
        await page.waitForLoadState("load");
      }
    }
  }

  const radios = page.locator('input[name="_shopping_order[Payment]"]');
  await expect(radios.first(), `${what}: ご注文手続きの支払方法の選択肢`).toBeAttached();
  const choices = await radios.evaluateAll((nodes) => nodes.map((n) => ({
    value: (n as HTMLInputElement).value,
    label: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    checked: (n as HTMLInputElement).checked,
  })));
  const pick = PAYMENTS.map((p) => choices.find((c) => c.label === p)).find(Boolean);
  if (!pick) throw new Error(`${what}: 支払方法に ${PAYMENTS.join("・")} のどれも無い（ある選択肢: ${choices.map((c) => c.label).join("、")}）`);
  if (!pick.checked) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.locator(`input[name="_shopping_order[Payment]"][value="${pick.value}"]`).check({ force: true }),
    ]);
    await page.waitForLoadState("load");
  }
  const accept = page.locator('input[name="_shopping_order[accept_order]"]');
  await expect(accept, `${what}: 「この内容で注文を確定します。」`).toHaveCount(1);
  await accept.check({ force: true });
  const submit = page.locator("button[data-js-payment-submit]");
  await expect(submit, `${what}: 確定のチェックで注文のボタンが押せる`).toBeEnabled();
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
  return m[1];
}

/** 会員でフロントにログインして、販売中の商品1点を注文し、ご注文番号を返す */
export async function 会員が注文する(browser: Browser, m: { メール: string; パスワード: string }, what: string, opt: { 出荷指示リストに載る配送?: boolean } = {}): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    await clearCart(page, () => undefined);
    await addFirstAvailable(page, 販売中の商品ID(), `${what}: 商品をカートに入れる`);
    return await checkout(page, `${what}: 注文`, opt.出荷指示リストに載る配送 ?? false);
  } finally {
    await context.close();
  }
}

/** 商品詳細の画面で、数量を入れられる先頭の規格の行に指定の数を入れて「カートに入れる」を押す（M05-21 が足した。addFirstAvailable の数量つき） */
async function addProductQuantity(page: Page, 商品ID: string, 数量: number, what: string): Promise<void> {
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
  const row = qty.locator("xpath=ancestor::tr[1]");
  await expect(row.locator(".qty-input"), `${what}: 入れた数量が送信用の数量の欄へ写る`).toHaveValue(String(数量));
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/products/add_cart/${商品ID}`) && r.request().method() === "POST"),
    form.locator("button.add-cart").dispatchEvent("click"),
  ]);
  if (res.status() >= 400) throw new Error(`${what}: カートへの追加の応答が ${res.status()}`);
  const body = await res.json().catch(() => null) as { done?: boolean; messages?: string[] } | null;
  if (body && body.done === false) throw new Error(`${what}: カートに入れられない: ${(body.messages ?? []).join(" / ")}`);
}

/**
 * 会員でフロントにログインし、指定の商品を指定の数ずつ（並べた順に）カートに入れて注文し、ご注文番号を返す（M05-21 が足した）。
 * 配送方法は出荷指示リストから除外されないもの、支払方法は外部の決済画面へ移らないもの（checkout と同じ）。
 */
export async function 会員が商品を注文する(browser: Browser, m: { メール: string; パスワード: string }, 明細: { 商品ID: string; 数量: number }[], what: string): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    await clearCart(page, () => undefined);
    for (const [i, x] of 明細.entries()) await addProductQuantity(page, x.商品ID, x.数量, `${what}: ${i + 1}件目の商品をカートに入れる`);
    return await checkout(page, `${what}: 注文`, true);
  } finally {
    await context.close();
  }
}
