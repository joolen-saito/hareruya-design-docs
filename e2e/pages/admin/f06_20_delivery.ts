/** F06-20 の連携ケース用: 管理画面の会員登録/編集画面のお届け先住所欄と配送先編集画面（読むだけ） */
import { expect, Page } from "@playwright/test";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** お届け先住所欄で、住所に語を含む行の住所リンクを押して配送先編集画面を開く */
export async function 住所リンクを押す(page: Page, 語: string): Promise<void> {
  const row = page.locator("#delivery tbody tr").filter({ hasText: new RegExp(esc(語)) });
  await expect(row, `お届け先住所欄の、住所に「${語}」を含む行`).toHaveCount(1, { timeout: 30_000 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
    row.locator('a[href*="/delivery/"][href$="/edit"]').first().click({ timeout: 30_000 }),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator('[name="customer_address[address_name]"]'), "配送先編集画面").toBeVisible({ timeout: 30_000 });
}

export type 配送先編集の値 = { 配送先名称: string; 姓: string; 名: string; カナ姓: string; カナ名: string; 国: string; 都道府県: string; 住所1: string; 住所2: string; 会社名: string };
export async function 配送先編集の値(page: Page): Promise<配送先編集の値> {
  const v = (n: string) => page.locator(`[name="customer_address[${n}]"]`);
  const sel = async (n: string) => ((await v(n).locator("option:checked").first().innerText().catch(() => "")) ?? "").trim();
  return {
    配送先名称: await v("address_name").inputValue(), 姓: await v("name][name01").inputValue(), 名: await v("name][name02").inputValue(),
    カナ姓: await v("kana][kana01").inputValue(), カナ名: await v("kana][kana02").inputValue(),
    国: await sel("country"), 都道府県: await sel("address][pref"), 住所1: await v("address][addr01").inputValue(), 住所2: await v("address][addr02").inputValue(),
    会社名: await v("company_name").inputValue(),
  };
}
