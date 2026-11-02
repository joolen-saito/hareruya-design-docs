/** M05-11 受注情報編集（注文者・お届け先の項目の最大文字数など）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { お届け先の項目, 注文者の項目 } from "../../db/m05_11";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-c";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

// ---- 最大文字数など、注文者とお届け先の項目の保存 ----

/** 画面の項目の識別（例: name_name01）から、保存値の項目名（name01）へ */
/** ふりがなはひらがなで入れてもカタカナで保存される。文字の種類の違いは同じ文字として比べる */
const 仮名正規化 = (s: string): string => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const 保存名 = (id: string): string => id.replace(/^[a-zA-Z]+_/, "").replace("postalCode_postalCode", "postal_code").replace("address_", "");

function 項目の保存(n: string, 両方: [string, string][], 注文者のみ: [string, string][], 期待: Record<string, string>): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage;
    let o: Record<string, string> = {}, s: Record<string, string> = {};
    await step(1, async () => { p = await 開く(browser, page, notes.get(key(n))); });
    await step(2, async () => {
      await p.両方に入れる(両方);
      for (const [id, v] of 注文者のみ) await page.locator(`#order_${id}`).fill(v, { timeout: 20_000 });
    });
    await step(3, async () => { await p.受注情報を登録する(onDialog); });
    await step(4, async () => { o = 注文者の項目(notes.get(key(n))); s = お届け先の項目(notes.get(key(n))); });
    await expected(async () => {
      for (const [k, v] of Object.entries(期待)) {
        const f = k.startsWith("kana") ? 仮名正規化 : (z: string) => z;
        expect.soft(f(o[k] ?? ""), `注文者の保存値（${k}）`).toBe(v);
        if (!注文者のみ.some(([id]) => 保存名(id) === k)) expect.soft(f(s[k] ?? ""), `お届け先の保存値（${k}）`).toBe(v);
      }
    });
  };
}
const あ = (n: number) => "あ".repeat(n);
const x = (c: string, n: number) => c.repeat(n);
caseTest("IT-M05-11-061", 項目の保存("061",
  [["name_name01", あ(50)], ["name_name02", あ(50)], ["kana_kana01", あ(50)], ["kana_kana02", あ(50)], ["abroad_postal_code", x("1", 50)]],
  [["company_name", あ(50)]],
  { name01: あ(50), name02: あ(50), kana01: あ(50), kana02: あ(50), abroad_postal_code: x("1", 50), company_name: あ(50) }));
caseTest("IT-M05-11-063", 項目の保存("063", [["address_addr01", あ(90)], ["address_addr02", あ(90)], ["address_addr03", あ(90)]], [], { addr01: あ(90), addr02: あ(90), addr03: あ(90) }));
caseTest("IT-M05-11-065", 項目の保存("065", [["postalCode_postalCode01", "123"], ["postalCode_postalCode02", "4567"], ["abroad_postal_code", x("1", 50)]], [], { postal_code: "1234567", abroad_postal_code: x("1", 50) }));
caseTest("IT-M05-11-067", 項目の保存("067",
  [["tel_tel01", "12345"], ["tel_tel02", "12345"], ["tel_tel03", "12345"], ["fax_fax01", "12345"], ["fax_fax02", "12345"], ["fax_fax03", "12345"]], [],
  { tel01: "12345", tel02: "12345", tel03: "12345", fax01: "12345", fax02: "12345", fax03: "12345" }));
caseTest("IT-M05-11-112", 項目の保存("112", [["name_name01", あ(16)], ["name_name02", あ(16)]], [], { name01: あ(16), name02: あ(16) }));
caseTest("IT-M05-11-114", 項目の保存("114", [["kana_kana01", あ(25)], ["kana_kana02", あ(25)]], [], { kana01: あ(25), kana02: あ(25) }));
caseTest("IT-M05-11-116", 項目の保存("116", [["address_addr01", あ(200)], ["address_addr02", あ(200)], ["address_addr03", あ(200)]], [], { addr01: あ(200), addr02: あ(200), addr03: あ(200) }));

caseTest("IT-M05-11-193", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let 前: Record<string, string> = {}, 後: Record<string, string> = {};
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("193"))); 前 = お届け先の項目(notes.get(key("193"))); });
  await step(2, async () => {
    await p.お届け先情報を開く();
    for (const id of ["tel_tel01", "tel_tel02", "tel_tel03"]) await page.locator(`#order_Shipping_${id}`).fill("", { timeout: 20_000 });
  });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { 後 = お届け先の項目(notes.get(key("193"))); });
  await expected(async () => {
    expect.soft([前.tel01, 前.tel02, 前.tel03], "更新前のお届け先の電話番号1〜3").toEqual(["121", "1211", "1212"]);
    expect.soft([後.tel01, 後.tel02, 後.tel03], "更新後のお届け先の電話番号1〜3（空で保存される）").toEqual(["", "", ""]);
  });
});
