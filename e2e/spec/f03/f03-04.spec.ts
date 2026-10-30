/**
 * F03-04 カテゴリ一覧。正本: cases/F03-04_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる 012・013・015・028・029・030 だけ。
 * ほかのケースは、使用シードの投入方法に「カテゴリID 100〜600をDBへ直接設定する」（S-F03-04-CATEGORIES）、
 * または「商品を作ったあと検索サービス（ユニサーチ）へ送信し索引への反映を待つ」（S-F03-04-PRODUCTS。外部の試験環境）が含まれるので実装しない
 * （記録 e2e/review/F03-04_progress_2026-10-30.md）。
 */
import { test } from "@playwright/test";
import { 子カテゴリの一覧 } from "../../db/f03_04";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { CategoryPage } from "../../pages/admin/category";
import { expectSaved } from "../../pages/admin/common";
import { FrontCategoryList, 入口 } from "../../pages/front/f03_04_category_list";
import { F0304_ADMIN } from "../../seeds/f03-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 並びを確かめる名称だけを取り出す（ほかのカテゴリが混在しても、本シードの相対順だけを見る） */
const only = (names: string[], wanted: string[]) => names.filter((n) => wanted.includes(n));

caseTest("IT-F03-04-012", async ({ page, step, expected, capture }) => {
  const list = new FrontCategoryList(page);
  const tops = ["並び順30カテゴリ", "並び順20カテゴリ", "並び順10カテゴリ"].map(rc);
  const kids = ["子カテゴリ30", "子カテゴリ20", "子カテゴリ10"].map(rc);
  let 第一階層: string[] = [];
  let 子: string[] = [];
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => {
    第一階層 = await list.その他の第一階層の名称();
    await list.展開する(tops[0]);
    子 = await list.子の名称(tops[0]);
    await capture("「並び順30カテゴリ」を展開した一覧");
  });
  await expected(async () => {
    expect.soft(only(第一階層, tops), "一覧の第一階層のカテゴリの並び（表示順30・20・10の降順）").toEqual(tops);
    expect.soft(only(子, kids), "「並び順30カテゴリ」の子カテゴリの並び（表示順30・20・10の降順）").toEqual(kids);
  });
});

caseTest("IT-F03-04-013", async ({ page, step, expected }) => {
  const list = new FrontCategoryList(page);
  let names: string[] = [];
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => { names = await list.第一階層の名称(); });
  await expected(async () => {
    expect.soft(names, "フロント非表示フラグが0の「フロント表示カテゴリ」が一覧に表示される").toContain(rc("フロント表示カテゴリ"));
    expect.soft(names, "フロント非表示フラグが1の「フロント非表示カテゴリ」が一覧に表示されない").not.toContain(rc("フロント非表示カテゴリ"));
  });
});

caseTest("IT-F03-04-015", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, F0304_ADMIN); // 事前準備: カテゴリ登録を操作できる稼働中の管理者でログイン
  const category = new CategoryPage(page);
  const parentId = notes.get("〔カテゴリID-F0304-015〕");
  let 子: ReturnType<typeof 子カテゴリの一覧> = [];
  await step(1, async () => { await category.openTop(); });
  await step(2, async () => { await category.selectInTree(parentId); });
  await step(3, async () => { await category.fill({ nameJp: "アンコモン", nameEn: "Uncommon", searchParameters: "rarity=2" }); });
  await step(4, async () => {
    await category.submitAndWait();
    for (const w of await expectSaved(page, "子カテゴリ作成")) note(`子カテゴリ作成の警告「${w}」`);
  });
  await step(5, async () => { 子 = 子カテゴリの一覧(parentId); });
  await expected(async () => {
    const hit = 子.filter((c) => c.名称 === "アンコモン" && c.英名 === "Uncommon" && c.検索パラメータ === "rarity=2");
    expect.soft(hit.length, "親カテゴリの子として、名称「アンコモン」・英名「Uncommon」・検索パラメータ「rarity=2」のカテゴリが登録された件数").toBe(1);
    expect.soft(子.length, "親カテゴリの子カテゴリの件数").toBe(1);
  });
});

caseTest("IT-F03-04-028", async ({ page, step, expected }) => {
  const list = new FrontCategoryList(page);
  const name = rc("フラグ確認カテゴリ F0304-CB028-A");
  let names: string[] = [];
  await step(1, async () => { expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => { names = await list.第一階層の名称(); });
  await expected(async () => {
    expect.soft(names, "本店のカテゴリ一覧に「フラグ確認カテゴリ F0304-CB028-A」（支店非表示フラグ1）が表示される").toContain(name);
  });
});

caseTest("IT-F03-04-029", async ({ page, step, expected }) => {
  const list = new FrontCategoryList(page);
  const name = rc("フラグ確認カテゴリ F0304-CB029-A");
  let names: string[] = [];
  await step(1, async () => { expect(await list.ECTOPを開く(入口.TC大阪支店), "支店ECTOPの応答").toBeLessThan(400); });
  await step(2, async () => { names = await list.第一階層の名称(); });
  await expected(async () => {
    expect.soft(names.length, "支店のカテゴリ一覧が描画されている（第一階層の数）").toBeGreaterThan(0);
    expect.soft(names, "支店のカテゴリ一覧に「フラグ確認カテゴリ F0304-CB029-A」（支店非表示フラグ1）が表示されない").not.toContain(name);
  });
});

caseTest("IT-F03-04-030", async ({ page, step, expected }) => {
  const list = new FrontCategoryList(page);
  const name = rc("フラグ確認カテゴリ F0304-CB030-A");
  const got: Record<string, string[]> = {};
  await step(1, async () => {
    expect(await list.ECTOPを開く(入口.本店), "本店ECTOPの応答").toBeLessThan(400);
    got["本店"] = await list.第一階層の名称();
  });
  await step(2, async () => {
    expect(await list.ECTOPを開く(入口.TC大阪支店), "支店ECTOPの応答").toBeLessThan(400);
    got["支店"] = await list.第一階層の名称();
  });
  await expected(async () => {
    expect.soft(got["本店"].length, "本店のカテゴリ一覧が描画されている（第一階層の数）").toBeGreaterThan(0);
    expect.soft(got["本店"], "本店のカテゴリ一覧に「フラグ確認カテゴリ F0304-CB030-A」（フロント非表示フラグ1）が表示されない").not.toContain(name);
    expect.soft(got["支店"].length, "支店のカテゴリ一覧が描画されている（第一階層の数）").toBeGreaterThan(0);
    expect.soft(got["支店"], "支店のカテゴリ一覧に「フラグ確認カテゴリ F0304-CB030-A」（フロント非表示フラグ1）が表示されない").not.toContain(name);
  });
});
