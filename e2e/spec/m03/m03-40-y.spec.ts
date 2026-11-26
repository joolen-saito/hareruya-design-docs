/**
 * M03-40 棚番号更新CSV登録の続き（-y）。正本: cases/M03-40_test_cases.tsv。シード: seeds/m03-40-y.ts
 * 実装したケース: 033。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { describeCsvUpload } from "../../pages/admin/m03_38_product_status_csv";
import { ShelfNumberCsvScreen, 棚番号更新CSV登録 } from "../../pages/admin/m03_40_shelf_number_csv";
import { M0340_ADMIN } from "../../seeds/m03-40";
import { m0340yFile } from "../../seeds/m03-40-y";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M03-40-033", async (ctx) => {
  await loginAdmin(ctx.page, M0340_ADMIN);
  const csv = new ShelfNumberCsvScreen(ctx.page);
  const seen: { 何: string; 戻った: boolean; 画面: string }[] = [];
  const 取り込む = async (n: number, 名前: string) => {
    await ctx.step(n, async () => {
      await csv.open();
      const f = m0340yFile(名前);
      note(`${名前}: ${f.name}（${f.内容の要約}）を選んだ`);
      const r = await csv.upload(f);
      note(`${名前} のアップロードの結果: ${describeCsvUpload(r)}`);
      seen.push({ 何: 名前, 戻った: await csv.isOnScreen(), 画面: new URL(ctx.page.url()).pathname });
    });
  };
  await 取り込む(1, "m0340-bad-header-033.csv");
  await 取り込む(2, "m0340-header-only-033.csv");
  await 取り込む(3, "m0340-three-columns-033.csv");
  await ctx.expected(async () => {
    expect(seen.length, "3回の操作の結果を読んだ").toBe(3);
    for (const s of seen) expect.soft(s.戻った, `${s.何}: 処理のあと棚番号更新CSV登録画面へ遷移（表示中 ${s.画面}・画面 ${棚番号更新CSV登録.画面}）`).toBe(true);
  });
});
