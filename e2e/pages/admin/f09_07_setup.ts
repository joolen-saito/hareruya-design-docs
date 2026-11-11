/**
 * F09-07 デッキリスト書き出し のシードで使う、管理画面の操作。セレクタはここだけに置く。
 *
 * - フォーマットの登録は「MTG ARENAで導入済」のチェックを扱うため、この機能用に置く（F09-01・F09-02 の部品はこの欄を扱わない）。
 *   フォーマットコードは画面の入力規則（10文字以内）に合わせ、F09-01 の部品（フォーマットコード()）で印つきの名前から作る。
 * - デッキの登録・削除は M15-05 の部品（m15_05_deck_edit）を、デッキ一覧の検索は M15-01 の部品（m15_deck）を使う。
 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved, setChecked } from "./common";
import { フォーマットコード } from "./f09_01_setup";
import { findFormatId } from "./m12_09_used_card";
import { デッキ一覧 } from "./m15_deck";
import { デッキ編集画面 } from "./m15_05_deck_edit";

type Issue = (m: string) => void;

export type F0907フォーマット = {
  /** フォーマット名(日)・(英)に同じ値を入れる（実行の印つきの値） */
  名: string;
  並び順: string;
  メタ日数: string;
  /** 「MTG ARENAで導入済」 */
  アリーナ導入済: boolean;
};

/**
 * フォーマットを、フォーマット一覧に同じ名前があればその編集画面で「MTG ARENAで導入済」が記載どおりかを確かめて使い、
 * 無ければ新規登録する。フォーマットの番号（編集画面のアドレスの番号）を返す。
 */
export async function フォーマットを用意する(page: Page, v: F0907フォーマット, issue: Issue): Promise<string> {
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  const found = await findFormatId(page, v.名);
  if (found) {
    await page.goto(adminUrl(`/format/${found}/edit`));
    await page.waitForLoadState("load");
    const on = await f("ArenaLegalFlg").isChecked();
    if (on !== v.アリーナ導入済) throw new Error(`フォーマット「${v.名}」は登録済みだが、「MTG ARENAで導入済」が${on ? "入っている" : "外れている"}（シード表と違う）`);
    issue(`フォーマット「${v.名}」は登録済みのものを使った（「MTG ARENAで導入済」が記載どおりであることを編集画面で確かめた）`);
    return found;
  }
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  await f("nameJp").fill(v.名);
  await f("nameEn").fill(v.名);
  await f("code").fill(フォーマットコード(v.名));
  await f("rank").fill(v.並び順);
  await f("MetaRange").fill(v.メタ日数);
  await setChecked(f("ArenaLegalFlg"), v.アリーナ導入済);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名}」の登録`)) issue(w);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** デッキ編集画面を開いて「削除」を押し、確認で削除を実行する */
export async function デッキを削除する(page: Page, デッキID: string): Promise<void> {
  await page.goto(adminUrl(`/deck/${デッキID}/edit`));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  await e.削除する(true);
  const 帯 = await e.エラーの帯();
  if (帯.length) throw new Error(`デッキ（ID ${デッキID}）を削除できない: ${帯.join(" / ")}`);
}

/** デッキ一覧の検索条件のデッキIDに入れ、開催日の条件を空にして「検索する」を押す。該当したデッキIDを返す */
export async function デッキIDで検索する(page: Page, デッキID: string): Promise<string[]> {
  const l = new デッキ一覧(page);
  await l.開く();
  await l.日付クリア.click();
  await l.f("deck_id").fill(デッキID);
  await l.検索する();
  return l.表示されたID();
}
