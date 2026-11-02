/** M05-11 受注情報編集（問い合わせの最大文字数）。正本: cases/M05-11_test_cases.tsv */
import { test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 問い合わせ } from "../../db/m05_11";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-b";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });

/** 問い合わせへ「問」を n 文字入力して登録し、DBで保存値を確かめる */
function 問い合わせ最大(n: string, 文字数: number): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const p = new OrderEditPage(page);
    let saved = "";
    await step(1, async () => { await p.openByOrderNo(notes.get(key(n)), await 店舗Aの店名(browser)); });
    await step(2, async () => { await p.注文者情報を開く(); await p.問い合わせ.fill("問".repeat(文字数)); });
    await step(3, async () => { await p.受注情報を登録する(onDialog); });
    await step(4, async () => { saved = 問い合わせ(notes.get(key(n))); });
    await expected(async () => {
      expect.soft(saved.length, `保存された問い合わせの文字数（入力は ${文字数} 文字）`).toBe(文字数);
      expect.soft(saved === "問".repeat(文字数), "保存された問い合わせが入力した値のとおり").toBe(true);
    });
  };
}

caseTest("IT-M05-11-069", 問い合わせ最大("069", 99999));
caseTest("IT-M05-11-118", 問い合わせ最大("118", 3000));
