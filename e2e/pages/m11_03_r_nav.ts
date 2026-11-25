/** M11-03 追加分: 管理画面の左ナビゲーションの、第1階層の下の項目（第2階層・第3階層）の読み取り。 */
import { Page } from "@playwright/test";

const 見出し = (page: Page, 第1階層: string) =>
  page.locator("li.c-mainNavArea__navItem").filter({ has: page.locator("a.c-mainNavArea__navItemTitle span", { hasText: new RegExp(`^\\s*${第1階層}\\s*$`) }) });

/** 第1階層の見出しを押して開き、その下の第2階層（文字）を返す */
export async function 第1階層を開いて第2階層を読む(page: Page, 第1階層: string): Promise<{ 見出しがある: boolean; 第2階層: string[]; 第3階層: string[] }> {
  const li = 見出し(page, 第1階層);
  const 見出しがある = (await li.count()) > 0;
  if (!見出しがある) return { 見出しがある, 第2階層: [], 第3階層: [] };
  const title = li.locator("a.c-mainNavArea__navItemTitle").first();
  if ((await title.getAttribute("aria-expanded")) !== "true") await title.click();
  const 文 = async (sel: string) => (await li.locator(sel).evaluateAll((es) => es.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()))).filter(Boolean);
  const 第2階層 = [...await 文("a.c-mainNavArea__navItemSubTitle span"), ...await 文("ul > li > a:not(.c-mainNavArea__navItemSubTitle) span")];
  const 第3階層 = await 文("ul ul li a span");
  return { 見出しがある, 第2階層, 第3階層 };
}
