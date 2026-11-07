/** M14-08 カードセット詳細(登録・編集・削除)の続き（公開側のカードセット選択メニューへの反映）。正本: cases/M14-08_test_cases.tsv */
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 欄, 入力する, 削除を実行する, 登録を押す, 登録画面を開く, 編集画面を開く } from "../../pages/admin/m14_08_cardset";
import { EctopCardsetMenu } from "../../pages/front/m14_08_ectop";
import { M1408L_ADMIN } from "../../seeds/m14-08-c";

caseTest("IT-M14-08-046", async ({ page, step, expected }) => {
  const 名 = rc("LinkSet001");
  const menu = new EctopCardsetMenu(page);
  let 登録 = { sent: false, url: "" };
  let 選択肢: string[] = [];
  let 選択後の表示 = "";
  await step(1, async () => { await loginAdmin(page, M1408L_ADMIN); });
  await step(2, async () => { await 登録画面を開く(page); });
  await step(3, async () => { await 入力する(page, { 名日: 名, 名英: 名, 略称: rc("LNK001"), リリース日: "2026-10-01" }); await expect(欄(page, "nameJp"), "カードセット名日本語の入力欄").toHaveValue(名); });
  await step(4, async () => { 登録 = await 登録を押す(page); });
  await step(5, async () => { await menu.開く(); });
  await step(6, async () => {
    await menu.メニューを押す();
    選択肢 = await menu.選択肢();
    const 行 = menu.選択肢の行(名);
    if ((await 行.count()) > 0) { await 行.first().click({ timeout: 20_000 }); 選択後の表示 = ((await menu.表示中の名.textContent()) ?? "").trim(); }
  });
  await expected(async () => {
    expect.soft(登録.sent && /\/cardset\/\d+\/edit/.test(登録.url), "カードセットが登録された（詳細画面へ移った）").toBe(true);
    expect.soft(選択肢.includes(名), "カードセット選択メニューの選択肢に登録したカードセットが含まれる").toBe(true);
    expect.soft(選択後の表示, "選択肢を選ぶとメニューの表示がそのカードセット名になる（単一選択）").toBe(名);
  });
});

caseTest("IT-M14-08-047", async ({ page, notes, step, expected }) => {
  const 名 = rc("LinkDelSet002"), id = notes.get("〔カードセットID-M1408-047〕");
  const menu = new EctopCardsetMenu(page);
  let 削除前: string[] = []; let 削除後: string[] = [];
  await step(1, async () => { await loginAdmin(page, M1408L_ADMIN); });
  await step(2, async () => { await menu.開く(); });
  await step(3, async () => { await menu.メニューを押す(); 削除前 = await menu.選択肢(); expect.soft(削除前.includes(名), "削除前: 選択肢に「LinkDelSet002」が含まれる").toBe(true); });
  await step(4, async () => { await 編集画面を開く(page, id); });
  await step(5, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); await expect(page.locator("#DeleteModal"), "削除の確認ポップアップ").toBeVisible(); });
  await step(6, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }), page.locator('#DeleteModal [data-method="delete"]').click({ timeout: 20_000 })]);
  });
  await step(7, async () => { await menu.開く(); });
  await step(8, async () => { await menu.メニューを押す(); 削除後 = await menu.選択肢(); });
  await expected(async () => { expect.soft(削除後.includes(名), "削除したカードセットが選択肢に含まれない（含まれるのは不合格）").toBe(false); });
});
