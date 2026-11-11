// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F06-20 の連携ケース用: 管理画面の会員登録/編集のお届け先住所欄と、配送先編集画面（読むだけ）。セレクタはここだけに書く。
 */
import { expect, Locator, Page } from "@playwright/test";

const T = 30_000;

/** 会員登録/編集画面のお届け先住所欄の、住所に語を含む行 */
export function お届け先の行(page: Page, 住所に含む語: string): Locator {
  return page.locator("#delivery tbody tr").filter({ hasText: 住所に含む語 });
}

/** お届け先住所欄で、住所に語を含む行の住所リンクを押して、配送先編集画面を開く */
export async function 住所リンクを押す(page: Page, 住所に含む語: string): Promise<void> {
  const row = お届け先の行(page, 住所に含む語);
  await expect(row, `お届け先住所欄に、住所に「${住所に含む語}」を含む行が1つある`).toHaveCount(1, { timeout: T });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
    row.locator('a[href*="/delivery/"][href$="/edit"]').first().click({ timeout: T }),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator('[name="customer_address[address_name]"]'), "配送先編集画面").toBeVisible({ timeout: T });
}

/** 配送先編集画面に表示されている値 */
export async function 配送先編集の値(page: Page): Promise<Record<string, string>> {
  const v = (n: string) => page.locator(`[name="customer_address[${n}]"]`);
  const sel = async (n: string) => ((await v(n).locator("option:checked").first().innerText().catch(() => "")) ?? "").trim();
  return {
    配送先名称: await v("address_name").inputValue(),
    姓: await v("name][name01").inputValue(), 名: await v("name][name02").inputValue(),
    セイ: await v("kana][kana01").inputValue(), メイ: await v("kana][kana02").inputValue(),
    国: await sel("country"), 都道府県: await sel("address][pref"),
    住所1: await v("address][addr01").inputValue(), 住所2: await v("address][addr02").inputValue(),
    会社名: await v("company_name").inputValue(),
  };
}
