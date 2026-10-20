/**
 * M04-19 のシードで使う、フロント（本店のサイト）での購入と、管理画面の受注情報編集での欠品登録。
 * フロントの画面の部品は e2e/pages/front に置くのが本来だが、この機能で作ってよいファイルの置き場に合わせてここに置く（要望として報告する）。
 *
 * フロントの画面の作り（アプリのテンプレートで確かめた）:
 * - 商品詳細: 規格の行の数量の欄（見えている入力欄）に数を入れると、画面のスクリプトが送信用の隠れた数量の欄へ写す。
 *   「カートに入れる」を押すと、画面のスクリプトがカートへの追加を問い合わせ（JSON の応答）、画面は移らない。在庫が無い規格には数量の欄が無い。
 * - カート: 「購入手続きへ」（ご注文手続き）のリンクでご注文手続きの画面へ移る。「カート一括削除」は確認のダイアログのあと全件を消す。
 * - ご注文手続き: 支払方法の選択肢を選ぶと、画面のスクリプトが送信して画面を作り直す。「この内容で注文を確定します。」に
 *   チェックを付けると「注文する」が押せる。押すと注文を確定し、ご注文完了の画面（ご注文番号を表示）へ移る。
 * 管理画面の受注情報編集の作り:
 * - 明細の行の「欠品登録」を押すと欠品数量の欄が出る。確定の保存は「受注情報を登録」を押したときだけ（「欠品登録」は欄を出すだけ）。
 * - 「受注情報を登録」の送信の前に、画面のスクリプトが確認のダイアログを出すことがある（数量と欠品数量が同じ・価格の差異など）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type 購入会員 = { メール: string; パスワード: string };

const front = (p: string) => `${BASE_URL}/ja${p}`;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 画面のスクリプトが出すダイアログを記録して受け入れる（記録は呼ぶ側の報告に載せる） */
function acceptDialogs(page: Page, onDialog: (m: string) => void): () => void {
  const handler = (d: import("@playwright/test").Dialog) => { onDialog(`${d.type()}「${d.message()}」`); void d.accept(); };
  page.on("dialog", handler);
  return () => page.off("dialog", handler);
}

/** フロントのログイン画面で会員としてログインする */
export async function frontLogin(page: Page, m: 購入会員): Promise<void> {
  await page.goto(front("/mypage/login"));
  await page.waitForLoadState("domcontentloaded");
  const form = page.locator("form#login_mypage");
  await expect(form, "フロントのログイン画面").toBeVisible();
  await form.locator('input[name="login_email"]').fill(m.メール);
  await form.locator('input[name="login_pass"]').fill(m.パスワード);
  // ログインのボタンは動きのある表示で位置が定まらないことがあるので、押す操作をボタンに直接送る
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    form.locator('button[type="submit"]').dispatchEvent("click"),
  ]);
  if (/\/mypage\/login/.test(page.url())) {
    const why = (await page.locator(".p-hareruya-login__form-error").allTextContents()).map((t) => t.trim()).filter(Boolean);
    throw new Error(`フロントにログインできない（${m.メール}）: ${why.join(" / ") || "ログイン画面のまま"}`);
  }
}

/** カートを空にする（前の実行の残りを持ち込まない） */
export async function clearCart(page: Page, onDialog: (m: string) => void): Promise<void> {
  await page.goto(front("/cart"));
  await page.waitForLoadState("load");
  const clear = page.locator("#cart-clear-btn");
  if ((await clear.count()) === 0) return;
  const off = acceptDialogs(page, onDialog);
  try {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), clear.click()]);
  } finally {
    off();
  }
  await page.waitForLoadState("load");
  await expect(page.locator("#cart-clear-btn"), "カートが空になった").toHaveCount(0);
}

/** 商品詳細の画面で、表示中の言語の規格の行（1行だけのとき）の数量を入れて「カートに入れる」を押す */
export async function addToCart(page: Page, 商品ID: string, 数量: number, what: string): Promise<void> {
  await page.goto(front(`/products/detail/${商品ID}`));
  await page.waitForLoadState("load");
  const form = page.locator(`form#productForm${商品ID}`);
  await expect(form, `${what}: 商品詳細の画面（商品ID ${商品ID}）`).toHaveCount(1);
  const table = form.locator('[id^="priceTable-"]:visible');
  await expect(table, `${what}: 商品詳細の価格・在庫の表`).toHaveCount(1);
  const qtyLabels = table.locator("tbody tr .qty-label");
  await expect(qtyLabels, `${what}: 数量を入れられる規格の行は1行（在庫が無い規格には数量の欄が無い）`).toHaveCount(1);
  await qtyLabels.fill(String(数量));
  await qtyLabels.blur();
  const hidden = table.locator("tbody tr .qty-input");
  await expect(hidden, `${what}: 入れた数量が送信用の数量の欄へ写る`).toHaveValue(String(数量));
  const button = form.locator("button.add-cart");
  await expect(button, `${what}: 「カートに入れる」`).toHaveCount(1);
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/products/add_cart/${商品ID}`) && r.request().method() === "POST"),
    button.dispatchEvent("click"),
  ]);
  if (res.status() >= 400) throw new Error(`${what}: カートへの追加の応答が ${res.status()}`);
  const body = await res.json().catch(() => null) as { done?: boolean; messages?: string[] } | null;
  if (body && body.done === false) throw new Error(`${what}: カートに入れられない: ${(body.messages ?? []).join(" / ")}`);
}

/**
 * カートからご注文手続きへ進み、支払方法を選んで注文を確定する。ご注文完了の画面のご注文番号と、選んだ支払方法を返す。
 * 支払方法は、銀行振込以外で、決済代行（外部の画面）へ移らないものを、prefer の順に選ぶ。
 */
export async function checkout(page: Page, prefer: string[], what: string): Promise<{ 注文番号: string; 支払方法: string }> {
  await page.goto(front("/cart"));
  await page.waitForLoadState("load");
  const toShopping = page.locator("a.p-hareruya-cart__checkout-btn");
  await expect(toShopping, `${what}: カートの「購入手続きへ」`).toHaveCount(1);
  await Promise.all([page.waitForURL(/\/shopping(\?.*)?$/, { waitUntil: "domcontentloaded" }), toShopping.click()]);
  await page.waitForLoadState("load");

  const radios = page.locator('input[name="_shopping_order[Payment]"]');
  await expect(radios.first(), `${what}: ご注文手続きの支払方法の選択肢`).toBeAttached();
  const choices = await radios.evaluateAll((nodes) => nodes.map((n) => ({
    value: (n as HTMLInputElement).value,
    label: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    checked: (n as HTMLInputElement).checked,
  })));
  const pick = prefer.map((p) => choices.find((c) => c.label === p)).find(Boolean);
  if (!pick) throw new Error(`${what}: 支払方法に ${prefer.join("・")} のどれも無い（ある選択肢: ${choices.map((c) => c.label).join("、")}）`);
  if (!pick.checked) {
    // 選ぶと画面のスクリプトが送信して画面を作り直す
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.locator(`input[name="_shopping_order[Payment]"][value="${pick.value}"]`).check({ force: true }),
    ]);
    await page.waitForLoadState("load");
    await expect(page.locator(`input[name="_shopping_order[Payment]"][value="${pick.value}"]`), `${what}: 支払方法「${pick.label}」が選ばれた`).toBeChecked();
  }

  const accept = page.locator('input[name="_shopping_order[accept_order]"]');
  await expect(accept, `${what}: 「この内容で注文を確定します。」`).toHaveCount(1);
  await accept.check({ force: true });
  const submit = page.locator("button[data-js-payment-submit]");
  await expect(submit, `${what}: 確定のチェックで注文のボタンが押せる`).toBeEnabled();
  // 押すと注文の確認と確定の要求を送り、ご注文完了の画面（確定できなければご注文手続きの画面かエラーの画面）へ移る
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), submit.click()]);
  await page.waitForLoadState("load");
  if (!/\/shopping\/complete/.test(page.url())) {
    const errors = (await page.locator(".p-hareruya-message-box--error, .ec-alert-warning, .error, .c-hareruya-form-input__field-error--server")
      .allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    throw new Error(`${what}: 注文が確定しない（${page.url()}）: ${errors.join(" / ") || "画面にエラーの表示なし"}`);
  }
  const heading = page.getByText(/ご注文番号\s*\S+/).first();
  await expect(heading, `${what}: ご注文完了の画面のご注文番号`).toBeVisible();
  const m = /ご注文番号\s*(\S+)/.exec((await heading.textContent()) ?? "");
  if (!m) throw new Error(`${what}: ご注文番号を読めない`);
  return { 注文番号: m[1], 支払方法: pick.label };
}

/**
 * 受注情報検索 一覧で、商品コードを入れて検索し、その受注の受注情報編集画面を開く。受注IDと注文番号を返す。
 * 店舗の絞り込みが空のときは、受注の店舗（本店）を選ぶ（店舗の欄は必須で、空のままではブラウザの入力チェックが送信を止める）。
 */
export async function openOrderEditByProductCode(page: Page, 商品コード: string, 本店: string, what: string): Promise<{ 受注ID: string; 注文番号: string }> {
  await page.goto(adminUrl("/order"));
  await page.waitForLoadState("load");
  const form = page.locator("form#search_form");
  await expect(form, "受注情報検索の検索欄").toBeVisible();
  const tenants = form.locator("#admin_search_order_tenants");
  if ((await tenants.count()) > 0) {
    const selected = await tenants.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value));
    if (selected.length === 0) {
      await tenants.evaluate((node, shop) => {
        const s = node as HTMLSelectElement;
        const hit = Array.from(s.options).find((o) => (o.textContent ?? "").trim() === shop) ?? s.options[0];
        hit.selected = true;
        const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
        if (w.jQuery) w.jQuery(s).trigger("change");
        else s.dispatchEvent(new Event("change", { bubbles: true }));
      }, 本店);
    }
  }
  await form.locator("#admin_search_order_multi").fill(商品コード);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator("#search_submit").click()]);
  await page.waitForLoadState("load");
  const hrefs = await page.locator('a.action-edit[href*="/order/"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  const ids = [...new Set(hrefs.map((h) => /\/order\/(\d+)\/edit/.exec(h)?.[1]).filter((v): v is string => !!v))];
  if (ids.length !== 1) throw new Error(`${what}: 受注情報検索で商品コード「${商品コード}」の受注が ${ids.length} 件（1件のはず）`);
  const link = page.locator(`a.action-edit[href$="/order/${ids[0]}/edit"]`).first();
  await Promise.all([page.waitForURL(new RegExp(`/order/${ids[0]}/edit`)), link.click()]);
  await page.waitForLoadState("load");
  return readOrderEditIds(page, what);
}

/** 受注情報編集画面のアドレスの受注の番号（受注ID）と、画面に表示された注文番号 */
export async function readOrderEditIds(page: Page, what: string): Promise<{ 受注ID: string; 注文番号: string }> {
  const m = /\/order\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: 受注情報編集画面のアドレスに受注の番号が無い（${page.url()}）`);
  const no = page.locator("a.order-history-order-no-link").first();
  await expect(no, `${what}: 受注情報編集画面の注文番号`).toBeVisible();
  const 注文番号 = ((await no.textContent()) ?? "").trim();
  if (!注文番号) throw new Error(`${what}: 注文番号が空`);
  return { 受注ID: m[1], 注文番号 };
}

/** 受注情報編集の明細で、商品コードが一致する商品の行 */
function itemRow(page: Page, 商品コード: string): Locator {
  return page.locator("#table-form-field tr.item_box").filter({
    has: page.locator("span.product-code", { hasText: new RegExp(`^\\s*${escapeRe(商品コード)}\\s*$`) }),
  });
}

/**
 * 受注情報編集画面で、明細の行ごとに「欠品登録」を押して欠品数量を入れ、最後に「受注情報を登録」を押す。
 * 送信の前のダイアログは受け入れて、文を onWarning に渡す。
 */
export async function registerShortages(page: Page, items: { 商品コード: string; 欠品数量: number }[], what: string, onWarning: (w: string) => void): Promise<void> {
  await page.waitForLoadState("load");
  for (const it of items) {
    const row = itemRow(page, it.商品コード);
    await expect(row, `${what}: 明細に商品コード「${it.商品コード}」の行が1行`).toHaveCount(1);
    const button = row.locator("button.btn-stockout");
    await expect(button, `${what}: 「欠品登録」`).toHaveText(/^\s*欠品登録\s*$/);
    await button.click();
    const input = row.locator('input[name$="[stockout]"]');
    await expect(input, `${what}: 欠品数量の欄`).toBeVisible();
    await input.fill(String(it.欠品数量));
  }
  const register = page.locator('button[type="submit"][name="mode"][value="register"]').filter({ hasText: /^\s*受注情報を登録\s*$/ }).first();
  await expect(register, `${what}: 「受注情報を登録」`).toBeVisible();
  const off = acceptDialogs(page, (m) => onWarning(`「受注情報を登録」を押したときのダイアログを受け入れた: ${m}`));
  try {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }), register.click()]);
  } finally {
    off();
  }
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, what)) onWarning(w);
  for (const it of items) {
    await expect(itemRow(page, it.商品コード).locator('input[name$="[stockout]"]'), `${what}: 保存後の「${it.商品コード}」の欠品数量`).toHaveValue(String(it.欠品数量));
  }
}
