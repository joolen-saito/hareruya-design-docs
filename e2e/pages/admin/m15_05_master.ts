/**
 * M15-05 デッキ編集 の共有マスタ（フォーマット・カード・アーキタイプ・デッキタグ）を画面で用意する部品。
 * セレクタはここだけに置く。シード（seeds/m15-05-b.ts）が使う。
 * 決め打ちの識別の値は、実行ごとの印を付けて作る（rc）。名前の対応は 名() で引く。
 */
import { expect, Page } from "@playwright/test";
import { RUN_MARK, rc } from "../../lib/run_marker";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { 行を用意する } from "./m14_04_master";
import { カードを登録する } from "./m14_card";

type Issue = (m: string) => void;

export const 正本名 = {
  標準: "デッキ試験標準", 上限: "デッキ試験上限", 下限: "デッキ試験下限", 単一: "デッキ試験単一", 統率なし: "デッキ試験統率なし",
  カードA: "DeckTestAlpha", カードB: "DeckTestBeta", 禁止: "DeckTestBanned", 範囲外: "DeckTestOut",
  型甲: "デッキ試験型甲", 型乙: "デッキ試験型乙", 型丙: "デッキ試験型丙", タグ一: "試験タグ一", タグ二: "試験タグ二",
} as const;
/** 実行の印つきの実際の名前 */
export const 名 = (key: keyof typeof 正本名): string => rc(正本名[key]);

/** 代表カードの画像は画面から登録できないため、画像つきの既存カードで代える（カードAの代わり・カードBの代わり） */
export const 代表カードの代役 = { A: "Lightning Bolt", B: "Saheeli Rai" } as const;

export type フォーマット定義 = { key: keyof typeof 正本名; 並び順: string; 統率?: boolean; ハイランダー?: boolean; メイン上限?: string; メイン下限?: string; 英名: string };

/** フォーマット登録画面で1件登録する（フォーマット名(英)は半角英数字だけの欄なので、英字の別名を入れる） */
export async function フォーマットを登録する(page: Page, d: フォーマット定義, issue: Issue): Promise<void> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(名(d.key));
  await f("nameEn").fill(`${d.英名}-${RUN_MARK}`);
  await f("rank").fill(d.並び順);
  await f("MetaRange").fill("30");
  if (d.メイン上限) await f("mainMaxCardCount").fill(d.メイン上限);
  if (d.メイン下限) await f("mainMinCardCount").fill(d.メイン下限);
  await f("useCommandFlg").setChecked(!!d.統率);
  await f("HighlanderFlg").setChecked(!!d.ハイランダー);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録)\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${名(d.key)}」の登録`)) issue(w);
}

export const フォーマット一覧: フォーマット定義[] = [
  { key: "標準", 並び順: "9501", 統率: true, 英名: "DeckTestStandard" },
  { key: "上限", 並び順: "9502", 統率: true, メイン上限: "5", 英名: "DeckTestMax" },
  { key: "下限", 並び順: "9503", 統率: true, メイン下限: "5", 英名: "DeckTestMin" },
  { key: "単一", 並び順: "9504", 統率: true, ハイランダー: true, 英名: "DeckTestSingle" },
  { key: "統率なし", 並び順: "9505", 英名: "DeckTestNoCommand" },
];

/** カード4件（リーガリティつき。画像は画面から登録できないので付けない） */
export async function カード4件を登録する(page: Page, issue: Issue): Promise<void> {
  const 全部 = (リーガリティ: string) => フォーマット一覧.map((x) => ({ フォーマット: 名(x.key), リーガリティ }));
  const 禁止版 = フォーマット一覧.map((x) => ({ フォーマット: 名(x.key), リーガリティ: x.key === "標準" ? "禁止" : "使用可" }));
  const defs: { key: keyof typeof 正本名; リーガリティ?: { フォーマット: string; リーガリティ: string }[] }[] = [
    { key: "カードA", リーガリティ: 全部("使用可") }, { key: "カードB", リーガリティ: 全部("使用可") },
    { key: "禁止", リーガリティ: 禁止版 }, { key: "範囲外" },
  ];
  for (const d of defs) {
    await カードを登録する(page, { カード名日: 名(d.key), カード名英: 名(d.key), 点数で見たマナ: "0", リーガリティ: d.リーガリティ }, 正本名[d.key], issue);
  }
}

export type アーキタイプ定義 = { key: keyof typeof 正本名; タグ: (keyof typeof 正本名)[]; 代表: "A" | "B" };

/** アーキタイプ登録画面で、フォーマット・デッキタグ・代表カード（検索して選ぶ）を指定して登録する */
export async function アーキタイプを登録する05(page: Page, d: アーキタイプ定義, issue: Issue): Promise<void> {
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(名(d.key));
  await f("nameEn").fill(名(d.key));
  await chooseByLabel(f("Disp"), "公開");
  await chooseByLabel(f("Format"), 名("標準"));
  if (d.タグ.length) await chooseByLabel(page.locator('[name="admin_archetype[DeckTags][]"]'), d.タグ.map((t) => 名(t)));
  await page.locator('[data-bs-target="#searchCardImageModal"]').click();
  const m = page.locator("#searchCardImageModal");
  await expect(m, "代表カード検索の画面").toBeVisible();
  await m.locator("#card_image_search_word").fill(代表カードの代役[d.代表]);
  await m.locator("#btn_search_card_image").click();
  const 決定 = m.locator("button.select-card-image").first();
  await expect(決定, `代表カード検索の結果に「${代表カードの代役[d.代表]}」が出る`).toBeVisible({ timeout: 30_000 });
  await 決定.click();
  await expect(m).toBeHidden();
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  for (const w of await expectSaved(page, `アーキタイプ「${名(d.key)}」の登録`)) issue(w);
}

export async function デッキタグ2件を登録する(page: Page): Promise<void> {
  for (const k of ["タグ一", "タグ二"] as const) await 行を用意する(page, "デッキタグ", 名(k), 名(k), "デッキ編集の共有マスタ");
}
