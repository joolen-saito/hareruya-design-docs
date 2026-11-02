/** M05-11 受注情報編集（任意項目を空にして保存）。正本: cases/M05-11_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { お届け先の項目, お届け先の配送項目, 注文者の項目, 受注 } from "../../db/m05_11";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-h";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });

caseTest("IT-M05-11-060", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get("〔受注番号-M0511-060〕");
  const p = new OrderEditPage(page);
  let o: Record<string, string> = {}, s: Record<string, string> = {};
  let ship = { お届け日: "", お届け時間: "", 送り状No: "" };
  let note = "";
  await step(1, async () => { await p.openByOrderNo(no, await 店舗Aの店名(browser)); });
  await step(2, async () => {
    await p.両方に入れる([["kana_kana01", ""], ["kana_kana02", ""], ["postalCode_postalCode01", ""], ["postalCode_postalCode02", ""], ["abroad_postal_code", ""], ["address_addr03", ""], ["fax_fax01", ""], ["fax_fax02", ""], ["fax_fax03", ""]]);
    await page.locator("#order_company_name").fill("", { timeout: 20_000 });
    await p.問い合わせ.fill("", { timeout: 20_000 });
    await page.locator("#order_Shipping_shipping_delivery_date").fill("", { timeout: 20_000 });
    await page.locator("#order_Shipping_DeliveryTime").selectOption({ index: 0 }, { timeout: 20_000 });
    await page.locator("#order_invoiceNumber").fill("", { timeout: 20_000 });
  });
  await step(3, async () => { await p.note.fill("任意項目空保存"); });
  await step(4, async () => { await p.受注情報を登録する(onDialog).catch((e) => { test.info().annotations.push({ type: "手順の注記", description: `保存できなかった: ${(e as Error).message.split("\n")[0]}` }); throw e; }); });
  await step(5, async () => { o = 注文者の項目(no); s = お届け先の項目(no); ship = お届け先の配送項目(no); note = String(受注(no).ショップ用メモ ?? ""); });
  await expected(async () => {
    const empty = ["kana01", "kana02", "postal_code", "abroad_postal_code", "addr03", "fax01", "fax02", "fax03"];
    expect.soft(empty.filter((k) => o[k] !== ""), "空にしたのに値が残った注文者の項目").toEqual([]);
    expect.soft(empty.filter((k) => s[k] !== ""), "空にしたのに値が残ったお届け先の項目").toEqual([]);
    expect.soft([o.company_name, o.message], "注文者の会社名・問い合わせ（空）").toEqual(["", ""]);
    expect.soft([ship.お届け日, ship.お届け時間, ship.送り状No], "お届け日・お届け時間・送り状No.（空）").toEqual(["", "", ""]);
    expect.soft(note, "ショップ用メモ欄").toBe("任意項目空保存");
  });
});
