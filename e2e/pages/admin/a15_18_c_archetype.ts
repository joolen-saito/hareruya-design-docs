/**
 * A15-18 続き（030・045・048・049）のシード用: 代表カードを指定の名前で探して選ぶアーキタイプの新規登録。
 * pages/admin/m15_08_archetype_search.ts の アーキタイプを新規登録する と同じ操作で、代表カード検索の検索語だけを指定できるようにしたもの
 * （既存の部品は代表カードを「検索結果の先頭」で選ぶため、更新前のデッキ画像と同じ画像を選ぶ恐れがある）。
 */
import { expect, Page } from "@playwright/test";
import { ArchetypeSearchPage, アーキタイプ編集の名日欄, アーキタイプ編集の送信ボタン } from "./m15_08_archetype_search";
import { chooseByLabel, expectSaved } from "./common";

type Issue = (m: string) => void;

export type 代表カード指定のアーキタイプ = { 名日: string; 名英: string; フォーマット: string; 代表カードの名前: string };

/** アーキタイプを新規登録し、選んだ代表カード画像の番号（代表カード検索の行のID）を返す */
export async function 代表カード付きでアーキタイプを新規登録する(page: Page, v: 代表カード指定のアーキタイプ, what: string, issue: Issue): Promise<string> {
  const s = new ArchetypeSearchPage(page);
  await s.開く();
  await s.新規登録を押す();
  await expect(アーキタイプ編集の名日欄(page), `${what}: アーキタイプ編集(登録)画面`).toBeVisible();
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"], [name="admin_archetype[${n}][]"]`).first();
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await page.locator('[data-bs-target="#searchCardImageModal"]').click();
  const m = page.locator("#searchCardImageModal");
  await expect(m, `${what}: 代表カード検索の画面`).toBeVisible();
  const rows = m.locator("#card_image_search_results tbody tr");
  await m.locator("#card_image_search_word").fill(v.代表カードの名前);
  const res = page.waitForResponse((r) => r.url().includes("/archetype/search_card_image"));
  await m.locator("#btn_search_card_image").click();
  await res;
  await expect(rows.first(), `${what}: 代表カード検索の結果（「${v.代表カードの名前}」）`).toBeVisible({ timeout: 30_000 });
  const id = (await rows.first().locator("td").first().innerText()).trim();
  await rows.first().locator("button.select-card-image").click();
  await expect(m).toBeHidden();
  if (!/^\d+$/.test(id)) throw new Error(`${what}: 代表カード検索の行のIDが読めない（${id}）`);
  await chooseByLabel(f("Disp"), "公開");
  await chooseByLabel(f("Format"), v.フォーマット);
  const button = アーキタイプ編集の送信ボタン(page);
  await expect(button, `${what}: アーキタイプ編集(登録)画面の「新規登録」`).toHaveText(/^\s*新規登録\s*$/);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), button.click({ noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: アーキタイプ「${v.名日}」の登録`)) issue(`アーキタイプ「${v.名日}」の登録時の警告「${w}」`);
  return id;
}
