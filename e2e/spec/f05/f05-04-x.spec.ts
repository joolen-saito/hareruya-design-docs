/**
 * F05-04 ネット買取商品詳細（DB での準備が要るケース）。正本: cases/F05-04_test_cases.tsv
 * 実装: 017（本店ECの1週間販売数 3 を、画面で作った印つきの商品の規格に DB で足し、ケースの終わりに消す）。
 * 見送り: 044〜046（アプリにネット買取商品詳細へ旧商品コードから入る入口が無い）・056（販促バナーの中身と置き場が正本・アプリから決まらない）。
 */
import { Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { NetBuyDetailPage } from "../../pages/front/f05_04_net_detail";
import "../../seeds/f05-04-x";

async function 詳細を開く(page: Page, 商品ID: string): Promise<NetBuyDetailPage> {
  const d = new NetBuyDetailPage(page);
  const status = await d.開く(商品ID);
  expect(status, `商品ID ${商品ID} のネット買取商品詳細の応答`).toBeLessThan(400);
  await expect(d.商品名, "ネット買取商品詳細の商品名の見出し").toBeVisible();
  return d;
}

caseTest("IT-F05-04-017", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-017〕")); await expect(d.カード説明, "カード説明の領域（読み込みの済んだ画面）").toBeVisible(); });
  await expected(async () => {
    expect(await d.文の数("週間販売数"), "「週間販売数」の表示の数").toBe(0);
  });
});
