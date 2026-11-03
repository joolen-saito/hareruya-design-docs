/** M11-05 マスタデータ管理の職業マスタ連携（IT-M11-05-001・002）。ケースの正本: integration_test/casegen/cases/M11-05_test_cases.tsv */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 会員登録の職業の選択肢, 職業マスタを開く, 職業の行を読む, 行に入れる, 保存する } from "../../pages/admin/m11_05_master";
import { M1105_ADMIN } from "../../seeds/m11-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M11-05-001", async ({ page, browser, step, expected }) => {
  let 保存済み = false, 一覧に出た = false;
  let 選択肢: string[] = [];
  await step(1, async () => { await loginAdmin(page, M1105_ADMIN); });
  await step(2, async () => { await 職業マスタを開く(page); });
  await step(3, async () => {
    const rows = await 職業の行を読む(page);
    const blank = rows.find((r) => r.id === "" && r.name === "");
    if (!blank) throw new Error("職業マスタに空の入力行が無い");
    await 行に入れる(page, blank.index, "9101", "連携職業001");
    const w = await 保存する(page, "職業マスタの保存");
    保存済み = true; if (w.length) note(`保存時の警告: ${w.join(" / ")}`);
  });
  await step(4, async () => { 一覧に出た = (await 職業の行を読む(page)).some((r) => r.name === "連携職業001"); });
  await step(5, async () => {
    const ctx = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
    try { const p2 = await ctx.newPage(); 選択肢 = await 会員登録の職業の選択肢(p2); } finally { await ctx.close(); }
  });
  await step(6, async () => { /* 選択肢は手順5で読んだ */ 選択肢 = [...選択肢]; });
  await expected(async () => {
    expect.soft(保存済み && 一覧に出た, "保存完了が表示され、職業の一覧に「連携職業001」が表示される").toBe(true);
    expect.soft(選択肢.includes("連携職業001"), "会員登録画面の職業の選択肢に「連携職業001」が表示される").toBe(true);
  });
});

caseTest("IT-M11-05-002", async ({ page, browser, step, expected }) => {
  let 保存済み = false, 一覧に出た = true;
  let 選択肢: string[] = [];
  await step(1, async () => { await loginAdmin(page, M1105_ADMIN); });
  await step(2, async () => { await 職業マスタを開く(page); });
  await step(3, async () => {
    const hit = (await 職業の行を読む(page)).find((r) => r.name === "連携職業002");
    if (!hit) throw new Error("名称「連携職業002」の行が職業マスタに無い");
    await 行に入れる(page, hit.index, "", "");
    const w = await 保存する(page, "職業マスタの保存");
    保存済み = true; if (w.length) note(`保存時の警告: ${w.join(" / ")}`);
  });
  await step(4, async () => { 一覧に出た = (await 職業の行を読む(page)).some((r) => r.name === "連携職業002"); });
  await step(5, async () => {
    const ctx = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
    try { const p2 = await ctx.newPage(); 選択肢 = await 会員登録の職業の選択肢(p2); } finally { await ctx.close(); }
  });
  await step(6, async () => { /* 選択肢は手順5で読んだ */ 選択肢 = [...選択肢]; });
  await expected(async () => {
    expect.soft(保存済み && !一覧に出た, "保存完了が表示され、職業の一覧に「連携職業002」が表示されない").toBe(true);
    expect.soft(選択肢.includes("連携職業002"), "会員登録画面の職業の選択肢に「連携職業002」が表示される（表示されないはず）").toBe(false);
  });
});
