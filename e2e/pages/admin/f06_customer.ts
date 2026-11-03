/** F06 の連携ケース用: 管理画面の会員検索一覧と会員登録/編集画面（読むだけ） */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 会員検索一覧（検索入力）の「会員ID・メールアドレス・お名前」に語を入れて検索する */
export async function searchCustomer(page: Page, 語: string): Promise<void> {
  await page.goto(adminUrl("/customer"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await page.locator('[name="admin_search_customer[multi]"]').fill(語, { timeout: 30_000 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
    page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click({ timeout: 30_000 }),
  ]);
  await page.waitForLoadState("load");
}

/** 検索結果の、メールアドレスが一致する行 */
export function resultRow(page: Page, メール: string) {
  return page.locator('tr[id^="ex-customer-"]').filter({ has: page.locator("td", { hasText: new RegExp(`^\\s*${esc(メール)}\\s*$`) }) });
}

/** 検索結果の行のうち、会員ID（行の id 属性）を読む。行が1つでなければ null */
export async function resultCustomerId(page: Page, メール: string): Promise<string | null> {
  const rows = resultRow(page, メール);
  if ((await rows.count()) !== 1) return null;
  return ((await rows.first().getAttribute("id")) ?? "").replace("ex-customer-", "") || null;
}

/** 検索結果の行の会員名を押して、会員登録/編集画面を開く */
export async function openEditFromResult(page: Page, メール: string): Promise<void> {
  const row = resultRow(page, メール);
  await expect(row, `検索結果にメールアドレス ${メール} の行が1つある`).toHaveCount(1, { timeout: 30_000 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
    row.locator('a[href*="/customer/"]').first().click({ timeout: 30_000 }),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator('[name="admin_customer[email]"]'), "会員登録/編集画面").toBeVisible({ timeout: 30_000 });
}

export type 編集画面の値 = Record<string, string>;
/** 会員登録/編集画面に表示されている値 */
export async function readEdit(page: Page): Promise<編集画面の値> {
  const v = (n: string) => page.locator(`[name="admin_customer[${n}]"]`);
  const sel = async (n: string) => ((await v(n).locator("option:checked").first().innerText().catch(() => "")) ?? "").trim();
  const radio = async (n: string) => {
    const checked = page.locator(`input[name="admin_customer[${n}]"]:checked`).first();
    if ((await checked.count()) === 0) return "";
    const id = await checked.getAttribute("id");
    return ((await page.locator(`label[for="${id}"]`).first().innerText().catch(() => "")) ?? "").trim();
  };
  const status = async () => {
    const s = v("status");
    const tag = await s.first().evaluate((e) => e.tagName).catch(() => "");
    return tag === "SELECT" ? sel("status") : radio("status");
  };
  return {
    お名前姓: await v("name][name01").inputValue(), お名前名: await v("name][name02").inputValue(),
    会社名: await v("company_name").inputValue(),
    国: await sel("country"), 都道府県: await sel("address][pref"),
    住所1: await v("address][addr01").inputValue(), 住所2: await v("address][addr02").inputValue(),
    メールアドレス: await v("email").inputValue(),
    性別: await radio("sex"), 職業: await sel("job"),
    生年月日年: await v("birth][year").inputValue().catch(async () => sel("birth][year")),
    生年月日月: await v("birth][month").inputValue().catch(async () => sel("birth][month")),
    生年月日日: await v("birth][day").inputValue().catch(async () => sel("birth][day")),
    会員ステータス: await status(),
  };
}

/** お届け先住所欄の各行の文 */
export async function deliveryRows(page: Page): Promise<string[]> {
  return (await page.locator("#delivery tbody tr").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
}
