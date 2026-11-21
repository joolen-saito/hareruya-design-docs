/**
 * M14-03 カード検索（一括削除）。正本: cases/M14-03_test_cases.tsv のうち IT-M14-03-002
 * 補い: カード名・検索語は実行の印つきの値で読んだ（seeds/m14-03.ts）。
 */
import { test, Page } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CardSearchPage } from "../../pages/admin/m14_card";
import { FG002語, M1403FG_ADMIN } from "../../seeds/m14-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 一括削除を押す。画面の確認ダイアログが出るので、受け入れる操作を返す（既存の M14-01 の一括削除と同じ作り） */
async function 一括削除を押す(page: Page) {
  const dialogP = page.waitForEvent("dialog", { timeout: 30_000 });
  const clickP = page.locator("#form_bulk button.action-submit").filter({ hasText: /^\s*一括削除\s*$/ }).click({ timeout: 30_000 });
  const dialog = await dialogP;
  note("確認ポップアップは画面の確認ダイアログ（「OK」で実行）として表示された");
  return {
    受け入れる: async () => {
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), dialog.accept()]);
      await clickP.catch(() => undefined);
    },
  };
}

caseTest("IT-M14-03-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1403FG_ADMIN);
  const l = new CardSearchPage(page);
  const id = notes.get("〔カードID-M1403-002〕");
  let 受 = async () => {};
  let 表示: string[] = [];
  let 通知 = "";
  await step(1, async () => { await l.open(); await l.キーワードで検索する(FG002語()); });
  await step(2, async () => { await l.カードを選択する([id]); });
  await step(3, async () => { 受 = (await 一括削除を押す(page)).受け入れる; });
  await step(4, async () => {
    await 受();
    通知 = ((await page.locator(".alert").allInnerTexts()).join(" / ")).replace(/\s+/g, " ");
    if (通知) note(`削除の後の画面の通知: ${通知}`);
  });
  await step(5, async () => { await l.キーワードで検索する(FG002語()); 表示 = await l.表示中のカードID(); });
  await expected(async () => {
    expect.soft(表示, `ID ${id} のカードが検索結果に表示されている`).toContain(id);
  });
});
