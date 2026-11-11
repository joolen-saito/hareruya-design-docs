/**
 * M09-07 ブロック管理（一覧の表示・削除不可・未登録・SP向け）の追加分。正本: cases/M09-07_test_cases.tsv
 * 「削除不可」「SP向け」は、画面で指定できないので、印つきのブロックに DB で設定した（seeds/m09-07-b.ts・db/m09_07_prep.ts）。
 * 001（PC向けがこの3件だけ）は実装しない。ほかのブロックが一覧に並ぶため、期待結果を満たす状態を作れない。
 * ブロック名・ファイル名には実行の印を付ける（seeds/m09-07.ts）。
 */
import { test, expect as pwExpect, Page } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ブロック管理 } from "../../pages/admin/m09_07_block";
import { ブロックIDで, ファイル名のPC向けブロック } from "../../db/m09_07_block";
import { ブロックを削除不可にする } from "../../db/m09_07_prep";
import { RUN_MARK } from "../../lib/run_marker";
import { M0907_ADMIN, シードのブロック群, ブロック名の識別, ファイル名の識別 } from "../../seeds/m09-07";
import { SP同名のファイル名 } from "../../seeds/m09-07-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ログインして = async (page: Page) => { await loginAdmin(page, M0907_ADMIN); return new ブロック管理(page); };
const 一覧のアドレス = /\/admin\/content\/block$/;
const DB設定の注記 = "ブロックの削除不可・SP向けは画面で指定できないので、DBで印つきのブロックに設定した";

caseTest("IT-M09-07-002", async ({ page, notes, step, expected }) => {
  const ids = ["A", "B", "C"].map((x) => notes.get(`〔ブロックID-M0907-002${x}〕`));
  const ファイル = シードのブロック群("S-M09-07-LIST-002").map((b) => b.ファイル名);
  const ba = await ログインして(page);
  await step(1, async () => { await ba.一覧を開く(); });
  const 欄: string[] = [];
  await step(2, async () => { for (const id of ids) { await ba.行(id).scrollIntoViewIfNeeded(); 欄.push((await ba.行(id).innerText()).replace(/\s+/g, " ")); } });
  await expected(async () => {
    ids.forEach((id, i) => expect.soft(欄[i], `ID ${id} の行のファイル名欄（登録されたファイル名）`).toContain(ファイル[i]));
  });
  note(`${DB設定の注記}。ファイル名は実行の印を付けた値。一覧のファイル名欄は「ファイル名.ja.twig」の形で表示される`);
});

caseTest("IT-M09-07-004", async ({ page, notes, step, expected }) => {
  const [A, B, C, D] = ["A", "B", "C", "D"].map((x) => notes.get(`〔ブロックID-M0907-004${x}〕`));
  const ba = await ログインして(page);
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await ba.検索する("MATCH"); await page.waitForTimeout(500); });
  await expected(async () => {
    const 見え = await ba.見えている行.evaluateAll((rows) => rows.map((r) => r.id.replace("ex-block-", "")));
    expect.soft(見え, "ブロック名に MATCH を含むID Cが表示される").toContain(C);
    expect.soft(見え, "ファイル名に MATCH を含むID Aが表示される").toContain(A);
    expect.soft(見え, "MATCH を含まないID Bが表示されない").not.toContain(B);
    expect.soft(見え, "SP向けのID Dが表示されない").not.toContain(D);
  });
  note(`${DB設定の注記}。検索語は「MATCH」のまま。ほかのブロックや前の実行の同名のブロックが表示されることは、期待結果の範囲外として確かめていない`);
});

caseTest("IT-M09-07-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-007〕");
  const 名 = シードのブロック群("S-M09-07-LIST-007")[0].ブロック名;
  const ba = await ログインして(page);
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await ba.行(id).scrollIntoViewIfNeeded(); });
  await expected(async () => {
    expect.soft((await ba.行(id).innerText()).replace(/\s+/g, " "), `ID ${id} のブロック名の表示`).toContain(名);
    await expect.soft(ba.名前リンク(id), "ブロック名がリンクでない（ラベルで表示）").toHaveCount(0);
    await expect.soft(ba.編集リンク(id), "編集リンクが表示されない").toHaveCount(0);
    await expect.soft(ba.削除ボタン(id), "削除ボタンが表示されない").toHaveCount(0);
  });
  note(DB設定の注記);
});

caseTest("IT-M09-07-010", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔ブロックID-M0907-010A〕"), B = notes.get("〔ブロックID-M0907-010B〕");
  const ba = await ログインして(page);
  let status = 0;
  await step(1, async () => { await ba.編集を開く(B, "ja"); });
  await step(2, async () => { status = await ba.編集をアドレスで開く(A); });
  await expected(async () => {
    await expect.soft(page.locator("#block_file_name"), "削除不可のID Aのブロック管理(編集)画面のファイル名欄が表示されない").toHaveCount(0);
    await expect.soft(page.locator("#block_name"), "削除不可のID Aのブロック管理(編集)画面のブロック名欄が表示されない").toHaveCount(0);
  });
  note(`${DB設定の注記}。削除不可のブロックの編集画面のアドレスを開いたときの応答の状態コードは ${status}、開いたあとの画面のアドレスは ${new URL(page.url()).pathname}`);
});

function 削除不可に変えて削除する(n: "013" | "014") {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const id = notes.get(`〔ブロックID-M0907-${n}〕`);
    const ba = await ログインして(page);
    await step(1, async () => { await ba.一覧を開く(); });
    await step(2, async () => { await ba.削除確認を開く(id); });
    await step(3, async () => { ブロックを削除不可にする(id, RUN_MARK); });
    await step(4, async () => { await ba.モーダルで削除を押す(id); });
    if (n === "013") {
      let 残っている = false;
      await step(5, async () => { 残っている = ブロックIDで(id) !== null; });
      await expected(async () => { expect.soft(残っている, `ID ${id} のブロックがDBに残っている`).toBe(true); });
    } else {
      await expected(async () => {
        expect.soft(new URL(page.url()).pathname, "遷移した画面のアドレス（ブロック管理(一覧)）").toMatch(一覧のアドレス);
        await expect.soft(ba.検索ボックス, "一覧の検索ボックス").toBeVisible();
      });
    }
    note("手順3の「DBで削除不可に変更する」は、DBで印つきのブロックを削除不可に設定して行った");
  };
}
caseTest("IT-M09-07-013", 削除不可に変えて削除する("013"));
caseTest("IT-M09-07-014", 削除不可に変えて削除する("014"));

caseTest("IT-M09-07-017", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔ブロックID-M0907-017〕");
  const ba = await ログインして(page);
  let status = 0;
  await step(1, async () => { await ba.編集を開く(id, "ja"); });
  await step(2, async () => { status = await ba.編集をアドレスで開く("999999"); });
  await expected(async () => {
    expect.soft(status, "未登録のブロックIDで開いた画面の応答（404）").toBe(404);
    await expect.soft(page.locator("#block_name"), "ブロック管理(編集)画面の入力欄が表示されない（エラーの画面）").toHaveCount(0);
  });
  note("ID 999999 のブロックが無いことの用意（登録されていれば DB で削除する）は行わず、確かめてもいない");
});

caseTest("IT-M09-07-035", async ({ page, step, expected }) => {
  const ファイル = ファイル名の識別(SP同名のファイル名);
  const 名 = ブロック名の識別("PC同名ブロック");
  const ba = await ログインして(page);
  await step(1, async () => { await ba.新規画面を開く("ja"); });
  await step(2, async () => { await ba.入力する({ ブロック名: 名, ファイル名: ファイル, コード: "<div>端末種別確認</div>" }); });
  await step(3, async () => { const r = await ba.登録して結果を読む(); if (!r.成功) note(`登録できなかった: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`); });
  let 行: ReturnType<typeof ファイル名のPC向けブロック> = [];
  await step(4, async () => { 行 = ファイル名のPC向けブロック(ファイル); });
  await expected(async () => {
    expect.soft(行.length, `ファイル名「${ファイル}」のPC向けブロックの件数`).toBe(1);
    expect.soft(行[0]?.ブロック名, "登録されたPC向けブロックのブロック名").toBe(名);
  });
  note("SP向けブロックは ID 907035104 でなく、画面で作ったブロックを DB で SP向けに設定したもの（ブロック名・ファイル名は実行の印つき）。手順の入力値にも同じ印を付けた");
});

caseTest("IT-M09-07-044", async ({ page, notes, step, expected }) => {
  const [A, B] = ["A", "B"].map((x) => notes.get(`〔ブロックID-M0907-044${x}〕`));
  const ba = await ログインして(page);
  await step(1, async () => { await ba.一覧を開く(); });
  await step(2, async () => { await ba.検索する("m0907-044"); await page.waitForTimeout(500); });
  await step(3, async () => { await pwExpect(ba.行(A), `ID ${A} の行`).toBeVisible(); await pwExpect(ba.行(B), `ID ${B} の行`).toBeVisible(); });
  await step(4, async () => { await ba.行(A).scrollIntoViewIfNeeded(); });
  await step(5, async () => { await ba.行(B).scrollIntoViewIfNeeded(); });
  await expected(async () => {
    await expect.soft(ba.名前リンク(A), "削除可のID Aのブロック名がリンクで表示される").toHaveCount(1);
    await expect.soft(ba.編集リンク(A), "ID Aの編集リンクが表示される").toBeVisible();
    await expect.soft(ba.削除ボタン(A), "ID Aの削除ボタンが表示される").toBeVisible();
    await expect.soft(ba.名前リンク(B), "削除不可のID Bのブロック名がリンクでない（ラベル）").toHaveCount(0);
    await expect.soft(ba.編集リンク(B), "ID Bの編集リンクが表示されない").toHaveCount(0);
    await expect.soft(ba.削除ボタン(B), "ID Bの削除ボタンが表示されない").toHaveCount(0);
  });
  note(`${DB設定の注記}。検索語は「m0907-044」のまま`);
});
