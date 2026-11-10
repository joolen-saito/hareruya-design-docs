/**
 * F04-02 ご注文方法指定の続き（-f）。実施不可の見直しで流せる見込みになった 002・055・057・062・099。
 * 正本: cases/F04-02_test_cases.tsv。シードでの解釈は seeds/f04-02-f.ts と記録 review/F04-02_progress_2026-11-10_dev.md。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { 受注の支払方法IDと手数料 } from "../../db/f04_02_f";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { ShoppingPointArea } from "../../pages/front/f04_02_point";
import { ShoppingPage } from "../../pages/front/f04_shopping";
import { 状態 } from "../../seeds/f04-02-f";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-F04-02-002", async ({ page, step, expected }) => {
  supplement("会員ID「F0402-EMPTY-002」は画面が振った番号に読み替えた。商品0件のカートは、商品を1点入れてから買い物かごを空にして作った（DBシードの代わり）");
  await frontLogin(page, 状態("S-F04-02-EMPTY-CART-002").会員);
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.直接開く(); });
  await expected(async () => {
    expect.soft(sp.パス, "遷移先の画面（買い物かご）").toBe("/ja/cart");
  });
});

for (const n of ["055", "057"]) {
  if (n === "055") {
    caseTest("IT-F04-02-055", async ({ page, step, expected }) => {
      supplement("利用可能ポイント800は画面で作れないので、管理画面のポイント付与で保有ポイント1000だけを作った（ケースは800を確かめない）");
      await frontLogin(page, 状態("S-F04-02-POINT-055").会員);
      const sp = new ShoppingPage(page);
      const pt = new ShoppingPointArea(page);
      await step(1, async () => { await sp.買い物かごから開く(); });
      await step(2, async () => { await pt.欄.scrollIntoViewIfNeeded(); note(`ポイント欄の文: ${(await pt.欄.innerText()).replace(/\s+/g, " ").slice(0, 200)}`); });
      await expected(async () => {
        await expect.soft(pt.ポイント残高の表示, "ポイント残高の表示").toBeVisible();
        await expect.soft(pt.ポイント残高の表示, "ポイント残高（1,000）").toContainText(/1,?000/);
        await expect.soft(pt.使う, "ポイント使用（ポイントを使う）の選択欄").toBeAttached();
        await expect.soft(pt.ためる, "ポイント使用（ポイントをためる）の選択欄").toBeAttached();
        await expect.soft(pt.使用ポイント, "使用ポイントの入力欄").toBeVisible();
      });
    });
  } else {
    caseTest("IT-F04-02-057", async ({ page, step, expected }) => {
      supplement("利用可能ポイント800は画面で作れないので、管理画面のポイント付与で保有ポイント1000だけを作った（ケースは800を確かめない）");
      await frontLogin(page, 状態("S-F04-02-POINT-057").会員);
      const sp = new ShoppingPage(page);
      const pt = new ShoppingPointArea(page);
      let ためる時 = true; let 使う時 = false;
      await step(1, async () => { await sp.買い物かごから開く(); });
      await step(2, async () => { await pt.選ぶ("ためる"); ためる時 = await pt.使用ポイントが有効か(); });
      await step(3, async () => { await pt.選ぶ("使う"); 使う時 = await pt.使用ポイントが有効か(); });
      await expected(async () => {
        expect.soft(ためる時, "ポイントをためるでは使用ポイントが非活性（入力できない）").toBe(false);
        expect.soft(使う時, "ポイントを使うでは使用ポイントが活性（入力できる）").toBe(true);
      });
    });
  }
}

caseTest("IT-F04-02-099", async ({ page, step, expected }) => {
  supplement("保有ポイント0・利用可能ポイント0は、登録したばかりの会員（ポイント付与なし）で作った。DB は書き換えていない");
  await frontLogin(page, 状態("S-F04-02-POINT-ZERO-099").会員);
  const sp = new ShoppingPage(page);
  const pt = new ShoppingPointArea(page);
  let 初期値 = "";
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await pt.選ぶ("使う"); });
  await step(3, async () => { 初期値 = await pt.使用ポイント.inputValue(); });
  await expected(async () => {
    expect.soft(初期値, "使用ポイントの初期値（保有0と利用可能0の小さい方）").toBe("0");
  });
});

caseTest("IT-F04-02-062", async ({ page, notes, step, expected }) => {
  supplement("銀行振込の手数料200への書き換え（共有の設定）は行っていない。開発環境の手数料のまま。支払方法ID 999999 が未登録であることは DB の参照で確かめた");
  const s = 状態("S-F04-02-EC-062");
  await frontLogin(page, s.会員);
  const sp = new ShoppingPage(page);
  const pt = new ShoppingPointArea(page);
  let 保存 = { 支払方法ID: "", 手数料: "" };
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => {
    const r = await pt.選択中の支払方法の値を変える("999999");
    note(`開発者ツールの代わりに、選択中の支払方法の値（${r.元の値}）を 999999 に書き換えて変更の知らせ（change）を送った。そのあとの画面: ${new URL(page.url()).pathname}`);
  });
  await step(3, async () => { 保存 = 受注の支払方法IDと手数料(notes.get("〔受注ID-F0402-062〕")); });
  await expected(async () => {
    expect.soft(保存.支払方法ID, "受注の支払方法（未設定）").toBe("");
    expect.soft(Number(保存.手数料), "受注の手数料（0円）").toBe(0);
  });
});
