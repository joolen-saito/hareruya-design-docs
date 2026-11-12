/**
 * F05-03 ネット買取商品一覧のシードで使う、管理画面の操作。セレクタはここだけに書く。
 * - MTGマスターデータ管理の「レアリティ」に新しい行を足す（日本語名・英語名・コード・並び順を入れて「登録」）
 *   レアリティの行は、日本語名・英語名・コード・並び順の4欄（アプリの MTGマスターデータ管理の作りで確かめた）。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

type レアリティ行 = { id: string; 日本語名: string; コード: string; 並び順: string };

async function レアリティを開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: "レアリティ" });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('form[method="get"] button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), "レアリティの一覧").toBeVisible();
}

async function レアリティの行(page: Page): Promise<レアリティ行[]> {
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
    const out: { id: string; 日本語名: string; コード: string; 並び順: string }[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "");
      out.push({ id: m[1], 日本語名: v("name_jp"), コード: v("code"), 並び順: v("sort_no") });
    }
    return out;
  });
}

/**
 * レアリティに新しい行を足し、増えた行の番号（検索の指定に使う値）を返す。
 * コードは他と重ならない値、並び順は既存の最大値 + 1。同じ日本語名・コードが前からあれば止める（取り違えない）。
 */
export async function レアリティを登録する(page: Page, v: { 日本語名: string; 英語名: string; コード: string }, what: string): Promise<string> {
  await レアリティを開く(page);
  const before = await レアリティの行(page);
  if (before.some((r) => r.日本語名 === v.日本語名)) throw new Error(`${what}: レアリティ「${v.日本語名}」が前からある`);
  if (before.some((r) => r.コード === v.コード)) throw new Error(`${what}: レアリティのコード「${v.コード}」が前からある`);
  const sort = Math.max(0, ...before.map((r) => Number(r.並び順)).filter((n) => Number.isFinite(n))) + 1;
  const f = (name: string) => page.locator(`[name="rows[new][${name}]"]`);
  await f("name_jp").fill(v.日本語名);
  await f("name_en").fill(v.英語名);
  await f("code").fill(v.コード);
  await f("sort_no").fill(String(sort));
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('button[type="submit"][form="edit_form"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: レアリティの登録`);
  await レアリティを開く(page);
  const added = (await レアリティの行(page)).filter((r) => r.日本語名 === v.日本語名);
  if (added.length !== 1) throw new Error(`${what}: レアリティ「${v.日本語名}」を登録して ${added.length} 行になった（1行のはず）`);
  return added[0].id;
}
