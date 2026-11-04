/**
 * M14-04 用: MTGマスターデータ管理で、カラー・色順などの行を「あれば使い、無ければ登録する」。
 * 既存の ensureMaster（m14_card.ts）は日本語名・英語名の種別だけを扱うので、色順（名称だけ）も扱えるこちらを使う。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type 種別 = "カラー" | "色順" | "イラストレーター" | "カードタイプ" | "サブタイプ" | "特殊タイプ" | "デッキタグ";

async function openMaster(page: Page, 名: 種別): Promise<void> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: 名 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('form[method="get"] button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), `${名}の一覧`).toBeVisible();
}

/** 既存の行の名称（日本語名、色順は名称）と並び順 */
async function rows(page: Page): Promise<{ 名: string; 並び順: number }[]> {
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
    const out: { 名: string; 並び順: number }[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "");
      out.push({ 名: v("name_jp") || v("nameJp") || v("name"), 並び順: Number(v("sort_no") || v("sortNo")) });
    }
    return out;
  });
}

/** 行（日本語名）が無ければ新規の行に登録する。登録したら true。英語名は欄が無い種別（色順）では使わない */
export async function 行を用意する(page: Page, 名: 種別, 日本語名: string, 英語名: string, what: string): Promise<boolean> {
  await openMaster(page, 名);
  const all = await rows(page);
  if (all.some((r) => r.名 === 日本語名)) return false;
  const f = (n: string) => page.locator(`[name="rows[new][${n}]"]`);
  if (await f("name_jp").count()) { await f("name_jp").fill(日本語名); await f("name_en").fill(英語名); } else if (await f("nameJp").count()) { await f("nameJp").fill(日本語名); await f("nameEn").fill(英語名); } else await f("name").fill(日本語名);
  const sort = (await f("sort_no").count()) ? f("sort_no") : f("sortNo");
  if (await sort.count()) await sort.fill(String(Math.max(0, ...all.map((r) => r.並び順).filter(Number.isFinite)) + 1));
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('button[type="submit"][form="edit_form"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: ${名}「${日本語名}」の登録`);
  return true;
}
