/**
 * F09-02 デッキ検索結果 のシード・手順で使う、管理画面の操作。セレクタはここだけに置く。
 *
 * - フォーマットの登録は、F09-01 の部品（f09_01_setup の フォーマットを登録する）がフォーマットコードにフォーマット名を
 *   そのまま入れる作りのため、この機能用に置く。フォーマットコードは画面の入力規則（10文字以内・半角英数字と _ - 空白）があり、
 *   実行の印つきのフォーマット名（10文字を超える）は入らない。シード表も「他のフォーマットと重ならない半角英数字10文字以内の値」と定める。
 * - デッキの登録・編集は M15-05 の部品（m15_05_deck_edit）を、デッキ一覧の検索は M15-01 の部品（m15_deck）を使う。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved, setChecked } from "./common";
import { デッキ一覧 } from "./m15_deck";
import { デッキ編集画面 } from "./m15_05_deck_edit";

type Issue = (m: string) => void;

export type F0902フォーマット = {
  /** フォーマット名(日)・(英)に同じ値を入れる（実行の印つきの値） */
  名: string;
  /** フォーマットコード（10文字以内の半角英数字） */
  コード: string;
  表示順: string;
  検索対象: boolean;
};

/** フォーマット管理の新規登録で登録し、フォーマットの番号（編集画面のアドレスの番号）を返す */
export async function フォーマットを登録する(page: Page, v: F0902フォーマット, issue: Issue): Promise<string> {
  if (!/^[A-Za-z0-9]{1,10}$/.test(v.コード)) throw new Error(`フォーマットコード「${v.コード}」が半角英数字10文字以内でない`);
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名);
  await f("nameEn").fill(v.名);
  await f("code").fill(v.コード);
  await f("rank").fill(v.表示順);
  await f("MetaRange").fill("30");
  await setChecked(f("searchFlg"), v.検索対象);
  await setChecked(f("rankingFlg"), false);
  await setChecked(f("OtherMetaFlg"), false);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名}」の登録`)) issue(w);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** デッキ一覧で、開催日の条件を空にしてプレイヤー名で検索し、出たデッキの番号を返す */
export async function プレイヤー名で検索する(page: Page, プレイヤー名: string): Promise<string[]> {
  const l = new デッキ一覧(page);
  await l.開く();
  await l.日付クリア.click();
  await l.f("player_name").fill(プレイヤー名);
  await l.検索する();
  return l.表示されたID();
}

/** デッキ一覧の検索結果の行から、デッキの編集画面を開く（行のデッキの番号の編集画面へ移る） */
export async function デッキの編集画面を開く(page: Page, デッキの番号: string): Promise<デッキ編集画面> {
  const row = new デッキ一覧(page).行(デッキの番号);
  await expect(row, `デッキ一覧の検索結果に、デッキ（番号 ${デッキの番号}）の行がある`).toHaveCount(1);
  const link = row.locator(`a[href*="/deck/${デッキの番号}/edit"]`).first();
  if (await link.count()) await Promise.all([page.waitForURL(new RegExp(`/deck/${デッキの番号}/edit`), { waitUntil: "load" }), link.click()]);
  else await page.goto(adminUrl(`/deck/${デッキの番号}/edit`));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  return e;
}
