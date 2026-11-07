/**
 * M15-05 デッキ編集 の「ケース専用アーキタイプ」を画面で用意する部品と、代表カード検索の操作。
 * セレクタはここだけに置く。シード（seeds/m15-05-f.ts）とテスト（spec/m15/m15-05-f.spec.ts）が使う。
 * 代表カードの画像は画面から登録できないため、画像つきの既存カード（代表カードの代役）で代える。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { 名, 代表カードの代役 } from "./m15_05_master";

type Issue = (m: string) => void;

/** アーキタイプ登録画面で、名前・フォーマット・公開状態を指定して登録する。代表は省略すると代表カードを選ばない */
export async function ケース専用アーキタイプを登録する(
  page: Page,
  d: { 名日: string; 名英: string; フォーマット: Parameters<typeof 名>[0]; 代表?: "A" | "B" },
  issue: Issue,
): Promise<void> {
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(d.名日);
  await f("nameEn").fill(d.名英);
  await chooseByLabel(f("Disp"), "公開");
  await chooseByLabel(f("Format"), 名(d.フォーマット));
  if (d.代表) {
    await page.locator('[data-bs-target="#searchCardImageModal"]').click();
    const m = page.locator("#searchCardImageModal");
    await expect(m, "代表カード検索の画面").toBeVisible();
    await m.locator("#card_image_search_word").fill(代表カードの代役[d.代表]);
    await m.locator("#btn_search_card_image").click();
    const 決定 = m.locator("button.select-card-image").first();
    await expect(決定, `代表カード検索の結果に「${代表カードの代役[d.代表]}」が出る`).toBeVisible({ timeout: 30_000 });
    await 決定.click();
    await expect(m).toBeHidden();
  }
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  for (const w of await expectSaved(page, `アーキタイプ「${d.名日}」の登録`)) issue(w);
}

/** デッキの編集・新規登録画面で「代表カード検索」を押し、カード名を入れて検索し、結果の先頭を選ぶ（モーダルの決定） */
export async function 代表カードを検索して選ぶ(page: Page, カード名: string): Promise<void> {
  await page.locator('[data-bs-target="#searchCardImageModal"]').click();
  const m = page.locator("#searchCardImageModal");
  await expect(m, "代表カード検索の画面").toBeVisible();
  await m.locator("#card_image_search_word").fill(カード名);
  await m.locator("#btn_search_card_image").click();
  const 決定 = m.locator("button.select-card-image").first();
  await expect(決定, `代表カード検索の結果に「${カード名}」が出る`).toBeVisible({ timeout: 30_000 });
  await 決定.click();
  await expect(m).toBeHidden();
}
