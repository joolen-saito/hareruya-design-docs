/** M03-25 重複商品コード確認。正本: cases/M03-25_test_cases.tsv（画面だけで準備できる 002） */
import { expect, test } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { DoublingCheckPage } from "../../pages/admin/m03_25_doubling_check";
import { M0325_ADMIN } from "../../seeds/m03-25";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M03-25-002", async ({ page, step, expected }) => {
  // 事前準備①: 新しいブラウザセッション（このケースのページ）でログインする
  await loginAdmin(page, M0325_ADMIN);
  const screen = new DoublingCheckPage(page);
  let fields: string[] = [];
  let pressed = 0;
  page.on("request", (r) => { if (/\/product\/doubling_check(\?|$)/.test(new URL(r.url()).pathname + new URL(r.url()).search)) pressed += 1; });
  await step(1, async () => {
    await screen.openFromMenu();
    await expect(page.locator(".c-pageTitle__subTitle"), "画面の見出し").toHaveText("重複商品コード確認");
  });
  await step(2, async () => {
    // 「重複確認する」は押さない。押す前の画面の本体にある入力欄を数える（本体を取り違えて0件にならないよう、ボタンが本体にあることも見る）
    await expect(screen.重複確認する, "画面の本体の「重複確認する」ボタン").toBeVisible();
    fields = await screen.入力欄();
    note(`「重複確認する」を押す前の画面の本体の入力欄: ${fields.length ? fields.join("、") : "なし"}`);
  });
  await expected(async () => {
    expect.soft(pressed, "「重複確認する」を押していない（確認の要求を送っていない）").toBe(0);
    expect.soft(fields, "検索条件の入力項目が表示されない").toEqual([]);
  });
});
