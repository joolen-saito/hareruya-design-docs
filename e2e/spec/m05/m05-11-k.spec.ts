/** M05-11 受注情報編集（履歴画面のFoil・フレーム表示）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { OrderEditPage, 明細行 } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-k";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const 履歴リンクの注記 = () => test.info().annotations.push({ type: "手順の注記", description: "受注データ更新履歴のリンクの文言は「画面操作変更」。これを正本の「変更」として押した（別タブで履歴画面が開く）" });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

/** 履歴画面で、特殊商品の行にだけバッジが出て、通常商品の行には出ないことを確かめる */
function バッジ(n: string, クラス: string, 何: string): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage, h!: OrderEditPage;
    const nrm = rc(`M0511-${n}-NRM`), spc = rc(`M0511-${n}-SPC`);
    let 特殊 = -1, 通常 = -1;
    await step(1, async () => { p = await 開く(browser, page, notes.get(key(n))); });
    await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); });
    await step(3, async () => {
      await h.status.waitFor({ state: "attached", timeout: 30_000 });
      特殊 = await 明細行(h.page, spc).locator(クラス).count();
      通常 = await 明細行(h.page, nrm).locator(クラス).count();
    });
    await expected(async () => {
      expect.soft(特殊 > 0, `特殊商品の行の${何}の表示`).toBe(true);
      expect.soft(通常, `通常商品の行の${何}の表示数`).toBe(0);
    });
  };
}
caseTest("IT-M05-11-146", バッジ("146", ".foil-badge", "Foil"));
caseTest("IT-M05-11-147", バッジ("147", ".frame-badge", "フレーム"));
