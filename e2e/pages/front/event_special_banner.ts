/** イベント大会TOP（フロント）の「大会特設ページ」一覧のバナー（M13-15 の037 が見る） */
import { Locator, Page } from "@playwright/test";

export type 特設バナー = { alt: string; src: string; link: string };

/** 見出し「大会特設ページ」の欄（バナーが1件も無いときは画面に出ない） */
export function 大会特設ページ一覧(page: Page): Locator {
  return page.locator("section.p-hareruya-section").filter({ has: page.locator("h2", { hasText: /^\s*大会特設ページ\s*$/ }) });
}

/** 大会特設ページ一覧に並ぶバナーの画像（alt・画像のアドレス・リンク先）。一覧が無ければ空 */
export async function 大会特設ページ一覧のバナー(page: Page): Promise<特設バナー[]> {
  const out: 特設バナー[] = [];
  for (const item of await 大会特設ページ一覧(page).locator("li.p-hareruya-banner__item").all()) {
    const img = item.locator("img.p-hareruya-banner__image");
    out.push({
      alt: (await img.getAttribute("alt")) ?? "",
      src: (await img.getAttribute("src")) ?? "",
      link: (await item.locator("a.p-hareruya-banner__link").getAttribute("href")) ?? "",
    });
  }
  return out;
}
