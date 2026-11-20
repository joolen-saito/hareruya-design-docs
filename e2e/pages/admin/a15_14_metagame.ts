/**
 * A15-14 メタゲーム情報参照のシードで使う、フォーマット・アーキタイプ・大会デッキの登録（管理画面）。
 * 名前はシード表の値のまま入れる（ケースが応答の名前をそのまま見るため）。2回目の実行で同じ名前の行が前の回にもあるので、
 * フォーマット・アーキタイプの選択欄は名前でなく、登録で控えた番号（選択肢の値）で選ぶ。
 * フォーマットコード（10文字以内・重複不可）だけは、名前に実行の印を足した値から作る（pages/admin/f09_01_setup.ts のフォーマットコード）。
 */
import { expect, Page } from "@playwright/test";
import { RUN_MARK } from "../../lib/run_marker";
import { adminUrl } from "../../lib/session";
import { expectSaved, setChecked } from "./common";
import { フォーマットコード } from "./f09_01_setup";

type Issue = (m: string) => void;

/** 選択欄を、選択肢の値（番号）で選ぶ。選択肢に無ければ投げる */
async function 値で選ぶ(page: Page, name: string, 値: string, 何: string): Promise<void> {
  const select = page.locator(`[name="${name}"]`);
  await expect(select.locator(`option[value="${値}"]`), `${何}: 選択肢の値 ${値}`).toHaveCount(1, { timeout: 15_000 });
  await select.selectOption({ value: 値 });
}

/** 選択欄を、選択肢の表示名で選ぶ（デッキタイプ・公開状態など、名前が重ならない選択肢） */
async function 名前で選ぶ(page: Page, name: string, 表示名: string, 何: string): Promise<void> {
  const select = page.locator(`[name="${name}"]`);
  const have = (await select.locator("option").allInnerTexts()).map((t) => t.trim());
  if (!have.includes(表示名)) throw new Error(`${何}: 選択肢「${表示名}」が無い（ある選択肢: ${have.filter(Boolean).join("、")}）`);
  await select.selectOption({ label: 表示名 });
}

/** フォーマット管理の新規登録で登録し、フォーマットの番号（編集画面のアドレスの番号）を返す */
export async function フォーマットを登録する(page: Page, v: { 名日: string; 名英: string; 並び順: string; メタ日数: string }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await f("code").fill(フォーマットコード(`${v.名日}${RUN_MARK}`));
  await f("rank").fill(v.並び順);
  await f("MetaRange").fill(v.メタ日数);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名日}」の登録`)) issue(w);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** アーキタイプ一覧の新規登録（公開・フォーマットは番号で選ぶ）。アーキタイプの番号を返す */
export async function アーキタイプを登録する(page: Page, v: { 名日: string; 名英: string; フォーマット番号: string }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await 名前で選ぶ(page, "admin_archetype[Disp]", "公開", `アーキタイプ「${v.名日}」の公開状態`);
  await 値で選ぶ(page, "admin_archetype[Format]", v.フォーマット番号, `アーキタイプ「${v.名日}」のフォーマット`);
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  for (const w of await expectSaved(page, `アーキタイプ「${v.名日}」の登録`)) issue(w);
  const m = /\/archetype\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`アーキタイプ「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

export type デッキ = {
  /** 大会デッキ（event）かユーザーデッキ（user） */
  種類: "event" | "user";
  公開: boolean;
  フォーマット番号: string;
  アーキタイプ番号: string;
  /** 「yyyy-mm-ddThh:mm」（大会デッキの開催日時） */
  開催日時?: string;
  /** ユーザーデッキのプレイヤー名（シード表の「任意のプレイヤー」の代わり） */
  プレイヤー名?: string;
};

/** デッキ一覧の新規登録で1件登録し、デッキの番号を返す */
export async function デッキを登録する(page: Page, v: デッキ, 何: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_deck[${n}]"]`);
  await 名前で選ぶ(page, "admin_deck[DeckType]", v.種類, `${何}のデッキタイプ`);
  await 名前で選ぶ(page, "admin_deck[Disp]", v.公開 ? "公開" : "非公開", `${何}の公開状態`);
  await 値で選ぶ(page, "admin_deck[Format]", v.フォーマット番号, `${何}のフォーマット`);
  await 値で選ぶ(page, "admin_deck[Archetype]", v.アーキタイプ番号, `${何}のアーキタイプ`);
  await setChecked(f("privateFlg"), false);
  if (v.種類 === "event") {
    await f("eventNameJp").fill("結合試験大会");
    await f("eventNameEn").fill("Integration Event");
    await f("eventDate").fill(v.開催日時 ?? "");
  } else if (v.プレイヤー名) {
    await f("playerName").fill(v.プレイヤー名);
  }
  await page.locator('button[type="submit"][form="admin_deck"]').first().click();
  for (const w of await expectSaved(page, `${何}の登録`)) issue(w);
  const m = /\/deck\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${何}を登録したが、デッキ編集画面へ移らない（${page.url()}）`);
  return m[1];
}
