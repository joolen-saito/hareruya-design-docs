/** M05-11 受注情報編集（受注ステータス変更とポイント）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 会員ポイント, 受注の全項目 } from "../../db/m05_11";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-e";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
const 実名 = (s: string) => (s === "引き渡し済み" ? "引渡し済み" : s);
const 名称の注記 = (s: string) => { if (s !== 実名(s)) test.info().annotations.push({ type: "手順の注記", description: `ステータス「${s}」は手元の画面では「${実名(s)}」の名称` }); };
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

/** 変更後のステータスを選んで「受注ステータスを変更」を押し、DBで会員ポイントを確かめる（期待は呼び出し側の関数） */
function ステータスとポイント(n: string, 変更後: string, 期待: number | "増える", 押す: "ステータス変更" | "登録" = "ステータス変更"): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage;
    let pt = -1;
    await step(1, async () => { p = await 開く(browser, page, notes.get(key(n))); });
    await step(2, async () => { 名称の注記(変更後); await p.ステータスを選ぶ(実名(変更後)); });
    await step(3, async () => { if (押す === "登録") await p.受注情報を登録する(onDialog); else await p.ステータスを変更する(onDialog); });
    await step(4, async () => { pt = 会員ポイント(notes.get(key(n))); });
    await expected(async () => {
      if (期待 === "増える") expect.soft(pt, "出荷完了のあとの会員ポイント（操作前は1000。発生ポイントが付与されて増える）").toBeGreaterThan(1000);
      else expect.soft(pt, `会員ポイント（${期待}）`).toBe(期待);
    });
  };
}
caseTest("IT-M05-11-019", ステータスとポイント("019", "出荷完了", "増える"));
caseTest("IT-M05-11-127", ステータスとポイント("127", "引き渡し済み", 1050));
caseTest("IT-M05-11-128", ステータスとポイント("128", "引き渡し済み", 1050));
caseTest("IT-M05-11-210", ステータスとポイント("210", "出荷完了", 1050));
caseTest("IT-M05-11-211", ステータスとポイント("211", "出荷完了", 1050, "登録"));

/** 現在と同じステータスを選んで「受注ステータスを変更」を押し、受注の全項目と会員ポイントが変わらないことを確かめる */
function 同じステータス(n: string, 現在: string, ポイント: number): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage;
    let 前: Record<string, string | null> = {}, 後: Record<string, string | null> = {};
    let 前pt = -1, 後pt = -1;
    await step(1, async () => { 前 = 受注の全項目(notes.get(key(n))); 前pt = 会員ポイント(notes.get(key(n))); });
    await step(2, async () => { p = await 開く(browser, page, notes.get(key(n))); });
    await step(3, async () => { 名称の注記(現在); await p.ステータスを選ぶ(実名(現在)); });
    await step(4, async () => { await p.ステータスを変更する(onDialog); });
    await step(5, async () => { 後 = 受注の全項目(notes.get(key(n))); 後pt = 会員ポイント(notes.get(key(n))); });
    await expected(async () => {
      expect.soft(後pt, `会員ポイント（${ポイント}のまま）`).toBe(ポイント);
      expect.soft(前pt, "操作前の会員ポイント").toBe(ポイント);
      const 違う = Object.keys(前).filter((k) => 前[k] !== 後[k]);
      expect.soft(違う, "操作前から値が変わった受注の項目").toEqual([]);
    });
  };
}
caseTest("IT-M05-11-246", 同じステータス("246", "出荷完了", 1050));
caseTest("IT-M05-11-247", 同じステータス("247", "引き渡し済み", 1050));
caseTest("IT-M05-11-248", 同じステータス("248", "ピック中", 1000));
caseTest("IT-M05-11-250", 同じステータス("250", "店頭予約", 1000));

caseTest("IT-M05-11-076", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let pt = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("076"))); });
  await step(2, async () => { await p.ポイント設定("10", "200"); });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { pt = 会員ポイント(notes.get(key("076"))); });
  await expected(async () => { expect.soft(pt, "会員のポイント残高（操作前の1000から変わらない）").toBe(1000); });
});
