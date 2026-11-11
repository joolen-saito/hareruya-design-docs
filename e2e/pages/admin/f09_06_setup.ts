/**
 * F09-06 デッキリスト詳細 のシードで使う、管理画面の操作。セレクタはここだけに置く。
 *
 * - フォーマット: 共通設定の2件（MTG ARENAで導入済 の有無だけが違う）を、あれば確かめて使い、無ければ登録する。
 *   既存の部品（f09_01_setup・f09_02_setup の フォーマットを登録する）は「MTG ARENAで導入済」の欄を扱わないため、ここに置く。
 * - カードセット: リリース日と特殊セットフラグを指定して登録する（既存の ensureCardset はリリース日を今日にする作りのため）。
 * - カードの画像の言語: カード編集画面の画像情報で、画像のファイル名が一致する画像の言語を変えて登録する。
 * - デッキ・アーキタイプ・カードの登録は、M15-05・M14 の部品（m15_05_deck_edit・m14_card・card_csv）を使う。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved, setChecked } from "./common";
import { フォーマットコード } from "./f09_01_setup";
import { findFormat, CardSearchPage } from "./m14_card";
import { CardEditPage } from "./m14_04_card_edit";
import { デッキ一覧 } from "./m15_deck";
import { デッキ編集画面 } from "./m15_05_deck_edit";

type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// フォーマット（共通設定）
// ---------------------------------------------------------------------------

export type 共通フォーマット = { 名: string; 名英: string; 並び順: string; アリーナ対応: boolean };

/**
 * フォーマット名(日)のフォーマットがあれば、編集画面で「MTG ARENAで導入済」がシード表と同じかを確かめて使う（違えば落とす。
 * 共通設定は「参照のみで変更しない」ので直さない）。無ければフォーマット登録で登録する。
 * ほかの必須項目: フォーマットコードは名前から作る10文字の英数字（f09_01_setup の フォーマットコード()）、メタゲーム分析日数は 30。
 */
export async function 共通フォーマットを用意する(page: Page, v: 共通フォーマット, issue: Issue): Promise<string> {
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  const found = await findFormat(page, v.名);
  if (found) {
    await page.goto(adminUrl(`/format/${found}/edit`));
    await page.waitForLoadState("load");
    const on = await f("ArenaLegalFlg").isChecked();
    if (on !== v.アリーナ対応) throw new Error(`フォーマット「${v.名}」の「MTG ARENAで導入済」が${on ? "入っている" : "入っていない"}（シード表は${v.アリーナ対応 ? "入れる" : "入れない"}）`);
    return found;
  }
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  await f("nameJp").fill(v.名);
  await f("nameEn").fill(v.名英);
  await f("code").fill(フォーマットコード(v.名));
  await f("rank").fill(v.並び順);
  if ((await f("MetaRange").inputValue()) === "") await f("MetaRange").fill("30");
  await setChecked(f("ArenaLegalFlg"), v.アリーナ対応);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名}」の登録`)) issue(`フォーマット「${v.名}」の警告「${w}」`);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

// ---------------------------------------------------------------------------
// カードセット
// ---------------------------------------------------------------------------

/** カードセット管理の新規登録（カードセット名(日)・(英)は同じ値、略称、リリース日「yyyy-mm-dd」、特殊セットフラグ）。番号を返す */
export async function カードセットを登録する(page: Page, v: { 名: string; 略称: string; リリース日: string; 特殊: boolean }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  await page.locator("#admin_cardset_nameJp").fill(v.名);
  await page.locator("#admin_cardset_nameEn").fill(v.名);
  await page.locator("#admin_cardset_code").fill(v.略称);
  const single = page.locator('input[name="admin_cardset[releaseDate]"]');
  if (await single.count()) await single.fill(v.リリース日);
  else {
    const [y, m, d] = v.リリース日.split("-");
    await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption(y);
    await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption(String(Number(m)));
    await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption(String(Number(d)));
  }
  await page.locator('[name="admin_cardset[specialFlg]"]').setChecked(v.特殊);
  await page.getByRole("button", { name: "登録", exact: true }).click();
  for (const w of await expectSaved(page, `カードセット「${v.名}」の登録`)) issue(`カードセット「${v.名}」の警告「${w}」`);
  const m = /\/cardset\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`カードセット「${v.名}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

// ---------------------------------------------------------------------------
// カード
// ---------------------------------------------------------------------------

/** カード一覧をカード名で検索し、カード名の欄がその名前で始まる行のカードIDを返す（1件でなければ落とす） */
export async function カード一覧のカードID(page: Page, カード名日: string): Promise<string> {
  const list = new CardSearchPage(page);
  await list.open();
  await list.キーワードで検索する(カード名日);
  const hit = (await list.表示行()).filter((r) => r.カード名 === カード名日 || r.カード名.startsWith(`${カード名日} `) || r.カード名.startsWith(`${カード名日}/`));
  if (hit.length !== 1) throw new Error(`カード一覧でカード名「${カード名日}」の行が ${hit.length} 件（1件のはず）`);
  return hit[0].カードID;
}

/** 画像URLのファイル名（拡張子を除いた最後の部分） */
export const 画像のファイル名 = (url: string): string => {
  const last = (url.split(/[?#]/)[0].split("/").pop() ?? "");
  return decodeURIComponent(last).replace(/\.[A-Za-z0-9]+$/, "");
};

/**
 * カード編集画面を開き、画像情報のうち画像URLのファイル名が一致する画像の言語を「日本語」に変えて、登録ボタンを押す。
 * 変えた画像の数を返す（ファイル名ごとに1つ見つからなければ落とす）。
 */
export async function 画像の言語を日本語にする(page: Page, カードID: string, ファイル名: string[], issue: Issue): Promise<void> {
  const e = new CardEditPage(page);
  const res = await e.open(カードID);
  if (!res || !res.ok()) throw new Error(`カード（ID ${カードID}）の編集画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  for (const name of ファイル名) {
    const items = page.locator(".image-item").filter({ has: page.locator('input[name$="[url]"]') });
    const idx = await items.evaluateAll((els, n) => els.map((el, i) => {
      const u = (el.querySelector('input[name$="[url]"]') as HTMLInputElement | null)?.value ?? "";
      const last = decodeURIComponent(u.split(/[?#]/)[0].split("/").pop() ?? "").replace(/\.[A-Za-z0-9]+$/, "");
      return last === n ? i : -1;
    }).filter((i) => i >= 0), name);
    if (idx.length !== 1) throw new Error(`カード（ID ${カードID}）の画像情報に、ファイル名 ${name} の画像が ${idx.length} 件（1件のはず）`);
    await items.nth(idx[0]).locator('select[name$="[language]"]').selectOption({ label: "日本語" });
  }
  const r = await e.登録を押す();
  if (!r.sent) throw new Error(`カード（ID ${カードID}）の登録ボタンを押しても送信されない`);
  for (const w of await expectSaved(page, `カード（ID ${カードID}）の画像の言語の変更`)) issue(`カード（ID ${カードID}）の警告「${w}」`);
}

// ---------------------------------------------------------------------------
// デッキ一覧（デッキIDで探す）
// ---------------------------------------------------------------------------

/** デッキ一覧で、開催日の条件を空にしてデッキIDで検索し、出たデッキの番号を返す */
export async function デッキIDで検索する(page: Page, デッキID: string): Promise<string[]> {
  const l = new デッキ一覧(page);
  await l.開く();
  await l.日付クリア.click();
  await l.f("deck_id").fill(デッキID);
  await l.検索する();
  return l.表示されたID();
}

/** デッキの編集画面を開いて「削除」で消す */
export async function デッキを削除する(page: Page, デッキID: string): Promise<void> {
  await page.goto(adminUrl(`/deck/${デッキID}/edit`));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  await e.削除する(true);
  const 帯 = await e.エラーの帯();
  if (帯.length) throw new Error(`デッキ（ID ${デッキID}）を削除できない: ${帯.join(" / ")}`);
  await expect(page, "削除のあとデッキ一覧へ戻る").not.toHaveURL(new RegExp(`/deck/${デッキID}/edit`));
}
