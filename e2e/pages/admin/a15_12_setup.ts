/**
 * A15-12 デッキ情報参照のシードが使う、管理画面の操作（デッキタグ・カードタイプ・カードCSV）。
 * セレクタはここだけに置く。フォーマット・アーキタイプ・キャンペーンタグは A15-17 の部品（pages/admin/a15_17_setup.ts）を呼んで使う。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { buildCardCsv, CardCsvRecord, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "./card_csv";
import { expectSaved } from "./common";
import { MtgMasterPage } from "./f03_03_masters";

type Issue = (m: string) => void;

/** MTGマスターデータの「デッキタグ」の表の最下行（空の行）に1件登録する */
export async function デッキタグを登録する(page: Page, v: { 名日: string; 名英: string; 並び順: string }, issue: Issue): Promise<void> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: "デッキタグ" });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
    page.locator('form[method="get"] button[type="submit"]').click({ noWaitAfter: true }),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), "デッキタグの一覧").toBeVisible();
  const f = (a: string, b: string) => page.locator(`[name="rows[new][${a}]"], [name="rows[new][${b}]"]`).first();
  await f("name_jp", "nameJp").fill(v.名日);
  await f("name_en", "nameEn").fill(v.名英);
  await f("sort_no", "sortNo").fill(v.並び順);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
    page.locator('button[type="submit"][form="edit_form"]').click({ noWaitAfter: true }),
  ]);
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, `デッキタグ「${v.名日}」の登録`)) issue(`デッキタグ「${v.名日}」の警告「${w}」`);
}

/** MTGマスターデータの「カードタイプ」に1件登録する */
export async function カードタイプを登録する(page: Page, v: { 名日: string; 名英: string }, issue: Issue): Promise<void> {
  const m = new MtgMasterPage(page);
  await m.open("cardtype");
  await m.fillNewRow({ 日本語名: v.名日, 英語名: v.名英, 並び順: await m.nextSortNo() });
  for (const w of await m.save(`カードタイプ「${v.名日}」の登録`)) issue(`カードタイプ「${v.名日}」の警告「${w}」`);
}

export type 試験カード = {
  名日: string; 名英: string; マナ: string; カードタイプ: string; 色: string; サブタイプ?: string;
  /** 画像URL（日本語）・画像URL（英語）。空なら入れない */
  画像日: string; 画像英: string;
};

/** カードCSV（カード詳細IDは空＝新規）で試験カードを登録する。カードセット・レアリティ・レイアウトは登録済みの名称を使う */
export async function 試験カードをCSVで登録する(page: Page, 行: 試験カード[], ファイル名: string, what: string, issue: Issue): Promise<void> {
  const 既存 = await readExistingCardValues(page);
  const headers = await downloadCardCsvTemplate(page);
  const rows: CardCsvRecord[] = 行.map((c) => ({
    name_jp: c.名日, name_en: c.名英, cmc: c.マナ, cardtype: c.カードタイプ, color: c.色, ...(c.サブタイプ ? { subtype: c.サブタイプ } : {}),
    set: 既存.set, rarity: 既存.rarity, layout: 既存.layout, image_jp: c.画像日, image_en: c.画像英, card_detail_id: "",
  }));
  await uploadCardCsv(page, buildCardCsv(headers, rows), ファイル名, what, (w) => issue(`カードCSVの警告「${w}」`));
  issue(`カード登録CSV（${rows.length}行）のカードセット「${既存.set}」・レアリティ「${既存.rarity}」・レイアウト「${既存.layout}」は、登録済みの名称から読んだもの（シード表の「任意」）`);
}
