/**
 * B16-09 サイトマップ生成処理のシードで使う、管理画面での登録（ユーザーページ・フォーマット・デッキ）。セレクタはここにだけ書く。
 * 部品は M09-04（ページ管理）・A15-14（フォーマット・アーキタイプ・デッキ）・M15-05（デッキの削除）を使い回す。
 */
import { expect, Page } from "@playwright/test";
import { RUN_MARK } from "../../lib/run_marker";
import { adminUrl } from "../../lib/session";
import { アーキタイプを登録する } from "./a15_14_metagame";
import { expectSaved, setChecked } from "./common";
import { フォーマットコード } from "./f09_01_setup";
import { ページ管理 } from "./m09_04_page";
import { デッキ編集画面 } from "./m15_05_deck_edit";

type Issue = (m: string) => void;

/** ユーザーページを1件登録し、ページIDを返す（URL欄・ファイル名は渡した値のまま。検索避けは空か noindex・none） */
export async function ユーザーページを作る(page: Page, v: { ページ名: string; URL: string; 検索避け?: string }): Promise<string> {
  const pa = new ページ管理(page);
  return pa.作る({ ページ名: v.ページ名, URL: v.URL, ファイル名: v.URL, コード: `<div class="b1609-page">${v.ページ名}</div>`, robot: v.検索避け ?? "", 言語: "ja" });
}

/** フォーマットを新規登録し、番号（編集画面のアドレスの番号）を返す。ランキング表示・メタ分布簡易化（他メタゲーム表示）を指定どおりにする */
export async function フォーマットを旗つきで登録する(page: Page, v: { 名: string; 並び順: string; ランキング表示: boolean; メタ分布簡易化: boolean }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名);
  await f("nameEn").fill(v.名);
  await f("code").fill(フォーマットコード(`${v.名}${RUN_MARK}`));
  await f("rank").fill(v.並び順);
  await f("MetaRange").fill("30");
  await setChecked(f("rankingFlg"), v.ランキング表示);
  await setChecked(f("OtherMetaFlg"), v.メタ分布簡易化);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名}」の登録`)) issue(w);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** デッキの登録に使うフォーマット・アーキタイプ（ランキング表示・メタ分布簡易化はどちらも外す。デッキ一覧のサイトマップに出ない） */
export async function デッキ用の型を用意する(page: Page, 記号: string, issue: Issue): Promise<{ フォーマット: string; アーキタイプ: string }> {
  const 名 = `B1609-${記号}-F-${RUN_MARK}`;
  const フォーマット = await フォーマットを旗つきで登録する(page, { 名, 並び順: "9900", ランキング表示: false, メタ分布簡易化: false }, issue);
  const アーキタイプ = await アーキタイプを登録する(page, { 名日: `B1609-${記号}-A-${RUN_MARK}`, 名英: `B1609-${記号}-A-${RUN_MARK}`, フォーマット番号: フォーマット }, issue);
  issue(`デッキの「フォーマット・アーキタイプは任意」は、このシード用にフォーマット「${名}」（並び順 9900・ランキング表示とメタ分布簡易化は外す）と、そのアーキタイプを登録して選んだ（実行の印つき）`);
  return { フォーマット, アーキタイプ };
}

/** 選択欄を、選択肢の値（番号）で選ぶ */
async function 値で選ぶ(page: Page, name: string, 値: string, 何: string): Promise<void> {
  const select = page.locator(`[name="${name}"]`);
  await expect(select.locator(`option[value="${値}"]`), `${何}: 選択肢の値 ${値}`).toHaveCount(1, { timeout: 15_000 });
  await select.selectOption({ value: 値 });
}
/** 選択欄を、選択肢の表示名で選ぶ */
async function 名前で選ぶ(page: Page, name: string, 表示名: string, 何: string): Promise<void> {
  const select = page.locator(`[name="${name}"]`);
  const have = (await select.locator("option").allInnerTexts()).map((t) => t.trim());
  if (!have.includes(表示名)) throw new Error(`${何}: 選択肢「${表示名}」が無い（ある選択肢: ${have.filter(Boolean).join("、")}）`);
  await select.selectOption({ label: 表示名 });
}

export type 置くデッキ = {
  デッキ名: string;
  種類: "event" | "user";
  公開: boolean;
  /** 「非公開(採用カード情報を公開しない)」のチェック */
  採用カードを非公開: boolean;
};

/** デッキ一覧の新規登録で1件登録し、デッキの番号を返す */
export async function デッキを登録する(page: Page, 型: { フォーマット: string; アーキタイプ: string }, v: 置くデッキ, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_deck[${n}]"]`);
  await f("deckName").fill(v.デッキ名);
  await 名前で選ぶ(page, "admin_deck[DeckType]", v.種類, `デッキ「${v.デッキ名}」のデッキタイプ`);
  await 名前で選ぶ(page, "admin_deck[Disp]", v.公開 ? "公開" : "非公開", `デッキ「${v.デッキ名}」の公開状態`);
  await 値で選ぶ(page, "admin_deck[Format]", 型.フォーマット, `デッキ「${v.デッキ名}」のフォーマット`);
  await 値で選ぶ(page, "admin_deck[Archetype]", 型.アーキタイプ, `デッキ「${v.デッキ名}」のアーキタイプ`);
  await setChecked(f("privateFlg"), v.採用カードを非公開);
  if (v.種類 === "event") {
    await f("eventNameJp").fill("結合試験大会");
    await f("eventNameEn").fill("Integration Event");
    const d = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
    await f("eventDate").fill(`${d}T12:00`);
  } else {
    await f("playerName").fill("結合試験B1609プレイヤー");
  }
  await page.locator('button[type="submit"][form="admin_deck"]').first().click();
  for (const w of await expectSaved(page, `デッキ「${v.デッキ名}」の登録`)) issue(w);
  const m = /\/deck\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`デッキ「${v.デッキ名}」を登録したが、デッキ編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** E2E が登録したデッキを、デッキ編集画面の「削除」で消す（シード表の「登録後、削除ボタンで削除する」） */
export async function 登録したデッキを削除する(page: Page, デッキID: string): Promise<void> {
  await page.goto(adminUrl(`/deck/${デッキID}/edit`));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  await e.削除する(true);
  const 帯 = await e.エラーの帯();
  if (帯.length) throw new Error(`デッキ（ID ${デッキID}）を削除できない: ${帯.join(" / ")}`);
}
