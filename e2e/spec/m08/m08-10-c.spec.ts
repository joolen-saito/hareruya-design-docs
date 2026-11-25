/**
 * M08-10 本人確認画像を閲覧できない権限の管理者（006・010）。正本: cases/M08-10_test_cases.tsv
 * 書いた: 006・010
 * 補い: 本人確認画像を閲覧できない権限では、会員編集画面に「オンライン本人確認」ボタンが出ない（実装）。正本どおり手順2でボタンを押すので、ボタンが無ければ手順2で操作できずに落ちる。
 *   期待結果は正本のとおり確かめる形で書いた（モーダルが出ないと確かめられない）。操作を飛ばして合格にはしない。
 * 補い: 画像の保管先へ試験画像を入れる手段が無いので、画像は記録だけ DB で足した。
 * 実装しない: 023・027（別の回）
 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { M0810IdentificationPage } from "../../pages/admin/m08_10_identification";
import { M1103のアカウント } from "../../seeds/m11-03";
import "../../seeds/m08-10-c";

async function 編集画面を開く(page: import("@playwright/test").Page, 会員ID: string): Promise<M0810IdentificationPage> {
  const e = new M0810IdentificationPage(page);
  const status = await e.open(会員ID);
  expect(status, `会員ID ${会員ID} の会員編集画面の応答`).toBe(200);
  return e;
}

const 画像の枠 = (e: M0810IdentificationPage) => e.オンライン本人確認ポップアップ.locator(".modal-top-border .col-6");

caseTest("IT-M08-10-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1103のアカウント("S-M08-10-ADM-NOVIEW"));
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, notes.get("〔会員ID-M0810-共有B〕")); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await expect(画像の枠(e), "身分証画像の枠は4つ").toHaveCount(4); });
  await expected(async () => {
    expect(await 画像の枠(e).locator("img").count(), "身分証画像の数（表示されない）").toBe(0);
    for (let i = 0; i < 4; i++) await expect(画像の枠(e).nth(i), `画像枠${i + 1}が閲覧不可の状態`).toContainText("閲覧不可");
  });
});

caseTest("IT-M08-10-010", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1103のアカウント("S-M08-10-ADM-NOVIEW"));
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, notes.get("〔会員ID-M0810-共有B〕")); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => {
    await 画像の枠(e).first().click();
    await page.waitForTimeout(1000);
  });
  await expected(async () => {
    await expect(page.locator("#online_identification_image_preview"), "本人の顔写真の拡大表示は開かない").toBeHidden();
  });
});
