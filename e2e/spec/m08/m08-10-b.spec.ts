/**
 * M08-10 オンライン本人確認（身分証画像の枠）。正本: cases/M08-10_test_cases.tsv
 * 実装した: 007・009（本人の顔写真の記録が無い会員の、顔写真の枠）
 * 実装しない:
 * - 006・010: 本人確認画像を閲覧できない権限の管理者では、会員編集画面に「オンライン本人確認」ボタンもモーダルも出ない（アプリは閲覧不可の権限のとき、ボタンとモーダルを描かない）。
 *   手順2のボタンを押せず、期待の「各画像枠が閲覧不可の状態で表示」を確かめる枠が画面に無い。正本どおりに実行できないので書かない（設計と実装の食い違いの疑い。判断待ち）。
 * - 023・027: フロントのネット買取の申込みで作る買取情報が要る（別の回）。
 * 補い: 身分証画像の記録は DB で足した（表・裏・斜め）。保管先へ試験画像を入れる手段が無いので、ファイルは置いていない。
 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { M0810IdentificationPage } from "../../pages/admin/m08_10_identification";
import { M0810_VIEW } from "../../seeds/m08-10";
import "../../seeds/m08-10-b";

async function 編集画面を開く(page: import("@playwright/test").Page, 会員ID: string): Promise<M0810IdentificationPage> {
  const e = new M0810IdentificationPage(page);
  const status = await e.open(会員ID);
  expect(status, `会員ID ${会員ID} の会員編集画面の応答`).toBe(200);
  return e;
}

/** モーダルの身分証画像の枠（左上＝本人の顔写真） */
const 顔写真の枠 = (e: M0810IdentificationPage) => e.オンライン本人確認ポップアップ.locator(".modal-top-border .col-6").first();

caseTest("IT-M08-10-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, notes.get("〔会員ID-M0810-共有C〕")); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => { await expect(顔写真の枠(e), "本人の顔写真の枠").toBeVisible(); });
  await expected(async () => {
    expect(await 顔写真の枠(e).locator("img").count(), "本人の顔写真の枠の画像の数").toBe(0);
    await expect(顔写真の枠(e), "本人の顔写真の枠に未登録の表示（登録データなし）").toContainText("登録データなし");
  });
});

caseTest("IT-M08-10-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0810_VIEW);
  let e!: M0810IdentificationPage;
  await step(1, async () => { e = await 編集画面を開く(page, notes.get("〔会員ID-M0810-共有C〕")); });
  await step(2, async () => { await e.モーダルを開く(); });
  await step(3, async () => {
    expect(await 顔写真の枠(e).locator("img").count(), "押す前の顔写真の枠は未登録状態（画像なし）").toBe(0);
    await 顔写真の枠(e).getByText("登録データなし").click();
    await page.waitForTimeout(1000);
  });
  await expected(async () => {
    await expect(page.locator("#online_identification_image_preview"), "本人の顔写真の拡大表示は開かない").toBeHidden();
  });
});
