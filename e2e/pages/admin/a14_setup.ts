/**
 * A14-01・A14-02 のシードが使う、管理画面の操作（カードの登録は m14_card、マスターの有無は m14_05_card_csv_upload を使う）。セレクタはここ（と流用する部品）だけに書く。
 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { マスターにあるか } from "./m14_05_card_csv_upload";

/**
 * MTGマスターデータ管理の「色順」に、名称の行が無ければ、最下行の入力行に名称と並び順を入れて「登録」する。登録したら true。
 * 名称には呼ぶ側が決まった印を付ける（全員が使うマスタ。依頼者決定 2026-11-14「マスタは作ってよい」。1度だけ作って使い回す）。
 */
export async function 色順を用意する(page: Page, 名称: string, 並び順: string, what: string): Promise<boolean> {
  if (await マスターにあるか(page, "色順", 名称)) return false;
  await page.locator('[name="rows[new][name]"]').fill(名称);
  await page.locator('[name="rows[new][sort_no]"]').fill(並び順);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
    page.locator('button[type="submit"][form="edit_form"]').click({ noWaitAfter: true }),
  ]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: 色順「${名称}」の登録`);
  if (!(await マスターにあるか(page, "色順", 名称))) throw new Error(`${what}: 色順「${名称}」を登録したが、一覧に行ができていない`);
  return true;
}

/**
 * カードセット詳細(登録)画面で、カードセット名（日本語・英語）・略称・ブロック・リリース日を入れて「登録」し、カードセットIDを返す。
 * シンボル画像はアップロードしない（シード表のとおり）。名前には呼ぶ側が決まった印を付ける。
 */
export async function カードセットを登録する(page: Page, v: { 名日: string; 名英: string; 略称: string; ブロック: string; リリース日: string }, what: string): Promise<string> {
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  await page.locator("#admin_cardset_nameJp").fill(v.名日);
  await page.locator("#admin_cardset_nameEn").fill(v.名英);
  await page.locator("#admin_cardset_code").fill(v.略称);
  await page.locator('select[name="admin_cardset[Cardsetblock]"]').selectOption({ label: v.ブロック });
  const [y, m, d] = v.リリース日.split("-");
  const date = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await date.count()) await date.fill(v.リリース日);
  else {
    await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption(String(Number(y)));
    await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption(String(Number(m)));
    await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption(String(Number(d)));
  }
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `${what}: カードセット「${v.名英}」の登録`);
  const id = /\/cardset\/(\d+)/.exec(page.url())?.[1];
  if (!id) throw new Error(`${what}: 登録後にカードセットの編集画面へ移らない（${page.url()}）`);
  return id;
}
