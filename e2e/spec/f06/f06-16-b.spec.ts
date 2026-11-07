/** F06-16 大会デッキ登録編集（フロント）の続き。正本: cases/F06-16_test_cases.tsv。前の担当が未着手だったケースを、f06-16.spec.ts を変えずにここへ書く */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { DeckEditPage } from "../../pages/front/f06_16_deck_entry";
import { マイデッキのページを選ぶ, 表示中のマイデッキ, 表示中のマイデッキ名 } from "../../pages/front/f06_16_b_deck_entry";
import * as DB from "../../db/f06_16";
import { 会員一覧B as 会員一覧, 大会一覧B as 大会一覧, 禁止カード名, 統率カード名 } from "../../seeds/f06-16-b";
import "../../seeds/f06-16-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 会員 = (n: string) => { const m = 会員一覧.get(n); if (!m) throw new Error(`会員 ${n} が作られていない`); return m; };
const 大会 = (n: string) => { const d = 大会一覧.get(n); if (!d) throw new Error(`大会 ${n} が作られていない`); return d; };
const 行 = (text: string): string[] => text.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);

async function ログイン(page: Page, n: string): Promise<DeckEditPage> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await frontLogin(page, 会員(n));
  return new DeckEditPage(page);
}
const カード要約 = (id: string): string[] => DB.デッキのカード情報(id).map((c) => `${c.ボード}:${c.カード名}:${c.枚数}`).sort();

// ---- 017: マイデッキ21件のページ送り ----
caseTest("IT-F06-16-017", async ({ page, step, expected }) => {
  const e = await ログイン(page, "017");
  await step(1, async () => { await e.開く(大会("017").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.マイデッキを開く(); });
  let 一頁: string[] = [], 二頁: string[] = [];
  await step(3, async () => { 一頁 = await 表示中のマイデッキ名(e); });
  await step(4, async () => { await マイデッキのページを選ぶ(e, 2); });
  await step(5, async () => { await expect(表示中のマイデッキ(e), "2ページ目の表示").toHaveCount(1, { timeout: 30_000 }); 二頁 = await 表示中のマイデッキ名(e); });
  await expected(async () => {
    expect.soft(一頁.length, "1ページ目の件数").toBe(20);
    expect.soft(二頁.length, "2ページ目の件数").toBe(1);
    const 全部 = [...一頁, ...二頁];
    expect.soft(new Set(全部).size, "重複なく表示されたデッキ名の数").toBe(21);
    expect.soft([...全部].sort(), "表示された21件のデッキ名（欠落なし）").toEqual(Array.from({ length: 21 }, (_, i) => `PageDeck${String(i + 1).padStart(2, "0")}`));
  });
});

// ---- 019: 取得ボタンのあと、デッキIDを書き換えて選ぶ ----
caseTest("IT-F06-16-019", async ({ page, notes, step, expected }) => {
  const e = await ログイン(page, "019");
  await step(1, async () => { await e.開く(大会("019").日程ID); await e.入力する("メイン", "4 Island"); await e.入力する("サイド", "1 Negate"); });
  await step(2, async () => { await e.マイデッキを開く(); });
  await step(3, async () => {
    const 他人のデッキID = notes.get("〔マイデッキID-F0616-019B〕");
    // 開発者ツールで要素の属性を書き換えるのと同じ操作
    await e.マイデッキ("Own New").evaluate((el, id) => el.setAttribute("data-deck_id", id), 他人のデッキID);
    note(`「Own New」の対象デッキIDを、他会員所有の「Other Deck」のID（${他人のデッキID}）へ、開発者ツールと同じく要素の属性を書き換えて変更した`);
  });
  let m = "", s = "";
  await step(4, async () => { await e.マイデッキ("Own New").click({ timeout: 60_000 }); m = await e.メイン.inputValue(); s = await e.サイド.inputValue(); });
  await expected(async () => {
    expect.soft(行(m), "メインボード").toEqual(["4 Island"]);
    expect.soft(行(s), "サイドボード").toEqual(["1 Negate"]);
  });
});

// ---- 020: 統率者フォーマットのマイデッキの取り込み ----
caseTest("IT-F06-16-020", async ({ page, step, expected }) => {
  const e = await ログイン(page, "020");
  const N = 統率カード名["020"];
  await step(1, async () => { await e.開く(大会("020").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.マイデッキを開く(); });
  await step(3, async () => { await e.マイデッキ("Commander Import").click({ timeout: 60_000 }); });
  let m = "", c = "";
  await step(4, async () => { m = await e.メイン.inputValue(); c = await e.統率.inputValue(); });
  await expected(async () => {
    expect.soft(行(m)[0], "メインボードの先頭（統率領域）").toBe(`1 ${N.統率()}`);
    expect.soft(行(m), "メインボードの行（統率領域→日本語名のある島→日本語名の無いOpt）").toEqual([`1 ${N.統率()}`, `4 ${N.島()}`, `2 ${N.Opt()}`]);
    expect.soft(行(c), "統率領域の行").toEqual([`1 ${N.統率()}`]);
  });
});

// ---- 044・069・070・052: 提出とプレイヤー名・カード情報 ----
caseTest("IT-F06-16-044", async ({ page, step, expected }) => {
  const e = await ログイン(page, "044");
  const d = 大会("044");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", "4 Island"); });
  await step(4, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(5, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("044").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "登録されたデッキの件数").toBe(1);
    expect.soft(decks[0]?.プレイヤー名, "プレイヤー名（海外住所会員の氏名）").toBe("John Smith");
  });
});

caseTest("IT-F06-16-052", async ({ page, step, expected }) => {
  const e = await ログイン(page, "052");
  const d = 大会("052");
  note(`事前準備の「Forbidden Card」は、実行の印つきの名前（${禁止カード名()}）でカード新規登録画面から作り、Standardのリーガリティを「禁止」にした`);
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", `5 ${禁止カード名()}`); });
  let r: Awaited<ReturnType<DeckEditPage["提出する"]>> | undefined;
  await step(4, async () => { r = await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(5, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("052").選手ID); });
  await expected(async () => {
    expect.soft(r?.送信, "提出が送信された").toBe(true);
    expect.soft(decks.length, "登録されたデッキの件数").toBe(1);
    expect.soft(decks[0]?.フォーマット名, "登録されたデッキのフォーマット").toBe("Standard");
    expect.soft(decks[0] ? 行(decks[0].メイン) : [], "内容テキストのメインボード").toEqual([`5 ${禁止カード名()}`]);
  });
});

caseTest("IT-F06-16-069", async ({ page, step, expected }) => {
  const e = await ログイン(page, "069");
  const d = 大会("069");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", "4 Island"); });
  await step(4, async () => { await e.入力する("サイド", "2 Negate"); });
  await step(5, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(6, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("069").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "追加されたStandardの大会デッキの件数").toBe(1);
    expect.soft(decks[0]?.プレイヤー名, "プレイヤー名（先頭に半角スペース）").toBe(" TARO");
    expect.soft(decks[0] ? カード要約(decks[0].デッキID) : [], "デッキを構成するカード情報").toEqual(["Main Board:Island:4", "Side Board:Negate:2"]);
  });
});

caseTest("IT-F06-16-070", async ({ page, step, expected }) => {
  const e = await ログイン(page, "070");
  const d = 大会("070");
  note(`事前準備の「Unknown Card という現行カード情報が無い」ことは、DBの参照で確かめた（${DB.カードの件数("Unknown Card")}件）`);
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", "4 Island\n2 Unknown Card"); });
  await step(4, async () => { await e.入力する("サイド", "2 Negate"); });
  await step(5, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(6, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("070").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "追加されたStandardの大会デッキの件数").toBe(1);
    expect.soft(decks[0]?.プレイヤー名, "プレイヤー名（末尾に半角スペース）").toBe("YAMADA ");
    expect.soft(decks[0] ? 行(decks[0].メイン) : [], "内容テキストのメインボード").toEqual(["4 Island", "2 Unknown Card"]);
    expect.soft(decks[0] ? カード要約(decks[0].デッキID) : [], "デッキを構成するカード情報（IslandとNegateだけ）").toEqual(["Main Board:Island:4", "Side Board:Negate:2"]);
  });
});

// ---- 074・075: 統率者フォーマットのマイデッキを、ポップアップ内のフォーマット選択で取り込む ----
caseTest("IT-F06-16-074", async ({ page, step, expected }) => {
  const e = await ログイン(page, "074");
  const N = 統率カード名["074"];
  await step(1, async () => { await e.開く(大会("074").日程ID); await e.フォーマットを選ぶ("Standard"); });
  await step(2, async () => { await e.マイデッキを開く(); });
  await step(3, async () => {
    await e.マイデッキのフォーマット絞り込み.selectOption({ label: "Commander" });
    await e.マイデッキ("F0616-CB074-Commander").click({ timeout: 60_000 });
  });
  let fmt = "", m = "";
  await step(4, async () => { fmt = await e.選択中のフォーマット名(); m = await e.メイン.inputValue(); });
  await expected(async () => {
    expect.soft(fmt, "選択フォーマット").toBe("Commander");
    expect.soft(行(m), "Commanderのメインボード（統率領域→メイン）").toEqual([`1 ${N.統率()}`, `4 ${N.島()}`]);
  });
});

caseTest("IT-F06-16-075", async ({ page, step, expected }) => {
  const e = await ログイン(page, "075");
  const N = 統率カード名["075"];
  await step(1, async () => { await e.開く(大会("075").日程ID); await e.フォーマットを選ぶ("Standard"); });
  await step(2, async () => { await e.マイデッキを開く(); });
  await step(3, async () => {
    await e.マイデッキのフォーマット絞り込み.selectOption({ label: "Commander" });
    await e.マイデッキ("F0616-CB075-Commander").click({ timeout: 60_000 });
  });
  let fmt = "", m = "";
  await step(4, async () => { fmt = await e.選択中のフォーマット名(); m = await e.メイン.inputValue(); });
  await expected(async () => {
    expect.soft(fmt, "選択フォーマット").toBe("Standard");
    expect.soft(行(m), "Standardのメインボード（統率領域→メイン）").toEqual([`1 ${N.統率()}`, `4 ${N.島()}`]);
  });
});
