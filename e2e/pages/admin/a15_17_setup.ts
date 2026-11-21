/**
 * A15-17 デッキ登録インポートのシードが使う、管理画面の操作（フォーマット・キャンペーンタグ・カードCSV・アーキタイプ）。
 * セレクタはここだけに置く。既にある部品（カードCSVの組み立て・取込、アーキタイプの登録、保存の確かめ）は呼び出して使う。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { アーキタイプを登録する } from "./a15_14_metagame";
import { buildCardCsv, CardCsvRecord, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "./card_csv";
import { expectSaved, setChecked } from "./common";

type Issue = (m: string) => void;

/** フォーマット管理の新規登録（デッキビルダーで利用にチェック。統率でカードを使用するかは引数）。フォーマットの番号を返す */
export async function フォーマットを新規登録する(
  page: Page,
  v: { 名日: string; 名英: string; 並び順: string; コード: string; 統率を使う: boolean },
  issue: Issue,
): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await expect(f("nameJp"), "フォーマット登録画面のフォーマット名(日)").toBeVisible();
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await f("code").fill(v.コード);
  await f("rank").fill(v.並び順);
  if ((await f("MetaRange").inputValue()) === "") await f("MetaRange").fill("30");
  await setChecked(f("DeckbuilderFlg"), true);
  await setChecked(f("useCommandFlg"), v.統率を使う);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名日}」の登録`)) issue(`フォーマット「${v.名日}」の警告「${w}」`);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** アーキタイプ管理の新規登録（公開）。アーキタイプの番号を返す */
export async function アーキタイプを新規登録する(page: Page, v: { 名日: string; 名英: string; フォーマット番号: string }, issue: Issue): Promise<string> {
  return アーキタイプを登録する(page, v, issue);
}

/** MTGマスターデータの「キャンペーンタグ」の表の最下行（空の行）に1件登録する */
export async function キャンペーンタグを登録する(
  page: Page,
  v: { 名日: string; 名英: string; 開始: string; 終了: string; 並び順: string },
  issue: Issue,
): Promise<void> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: "キャンペーンタグ" });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
    page.locator('form[method="get"] button[type="submit"]').click({ noWaitAfter: true }),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), "キャンペーンタグの一覧").toBeVisible();
  const f = (n: string) => page.locator(`[name="rows[new][${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await f("viewStartDate").fill(v.開始);
  await f("viewEndDate").fill(v.終了);
  await f("sortNo").fill(v.並び順);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
    page.locator('button[type="submit"][form="edit_form"]').click({ noWaitAfter: true }),
  ]);
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, `キャンペーンタグ「${v.名日}」の登録`)) issue(`キャンペーンタグ「${v.名日}」の警告「${w}」`);
}

/** シード表の「画像URL(英語)は設計書の入力例の形式に沿った値」 */
export const 画像URLの例 = "img/goods/L/TDM/en_7de21787f2._jpg";

/**
 * カード登録CSVをカードCSVアップロード画面で取り込む。カード詳細のカードセット・レアリティ・レイアウトは登録済みのもの
 * （シード表の「MTGマスターデータへ登録済みの名称(英)」）、カード詳細IDは空（新規）、画像URL(英語)は設計書の入力例の形式。
 */
export async function カードをCSVで登録する(page: Page, 行: { 日: string; 英: string }[], ファイル名: string, what: string, issue: Issue): Promise<void> {
  const 既存 = await readExistingCardValues(page);
  const headers = await downloadCardCsvTemplate(page);
  const rows: CardCsvRecord[] = 行.map((c) => ({
    name_jp: c.日, name_en: c.英, cmc: "0", set: 既存.set, rarity: 既存.rarity, layout: 既存.layout, image_en: 画像URLの例,
  }));
  await uploadCardCsv(page, buildCardCsv(headers, rows), ファイル名, what, (w) => issue(`カードCSVの警告「${w}」`));
  issue(`カード登録CSV（${rows.length}行）のカードセット「${既存.set}」・レアリティ「${既存.rarity}」・レイアウト「${既存.layout}」は、登録済みの名称から読んだもの（シード表の「登録済みの名称」）`);
}
