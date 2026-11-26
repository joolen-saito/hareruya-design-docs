/**
 * M03-38 商品公開CSV登録が支店サイトのトップの「SALE中の商品」へ届くこと（043・044）。正本: cases/M03-38_test_cases.tsv
 * 支店 qbbranchpub は、店舗を作らない決まりのため既にある支店「TC大阪支店」（公開側 /ja/osaka/）で読み替えた（シード S-M03-38-QB-BRANCH）。
 * 公開側は、ケースの中で開く新しいブラウザ（日本語・ログアウト）で見る。
 */
import { test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { describeCsvUpload, ProductCsvUploadScreen, 商品公開CSV登録, CsvUploadResult } from "../../pages/admin/m03_38_product_status_csv";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { M0338L_ADMIN } from "../../seeds/m03-38";
import { 大阪支店, qbの商品 } from "../../seeds/m03-38-q";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

function SALE中への反映(n: string, 前に表示: boolean, 後に表示: boolean): CaseBody {
  return async ({ page, browser, step, expected }) => {
    const b = 大阪支店();
    const p = qbの商品(n);
    supplement(`支店URL qbbranchpub の支店は、既にある支店「${b.店名}」（${b.パス}/）で読み替えた。管理者 m0338qb-admin は連携試験の管理者で読み替えた。商品名には実行の印が付く`);
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
    await hideDebugToolbar(ctx);
    const top = new BranchTopPage(await ctx.newPage());
    const 数える = async (when: string): Promise<number> => {
      const st = await top.open(b.パス.replace(/^\/ja\//, ""));
      expect(st, `${when}: 支店サイトのTOPの応答`).toBeLessThan(400);
      const 件数 = await top.SALE中の商品(p.商品名).count();
      note(`${when}: 「SALE中の商品」に商品名「${p.商品名}」のカード ${件数} 件`);
      return 件数;
    };
    let 前 = -1, 後 = -1;
    let r: CsvUploadResult | null = null;
    try {
      await step(1, async () => { 前 = await 数える("手順1"); });
      await step(2, async () => { await loginAdmin(page, M0338L_ADMIN); });
      await step(3, async () => {
        await test.info().attach(`アップロードしたファイル ${p.csv.name}`, { body: p.csv.bytes, contentType: "text/csv" });
        note(`${p.csv.name} の内容: ${JSON.stringify(p.csv.内容)}`);
        const csv = new ProductCsvUploadScreen(page, 商品公開CSV登録);
        await csv.open();
        r = await csv.upload(p.csv);
        note(`アップロードの結果: ${describeCsvUpload(r)}`);
        expect(r.送信した, "アップロードが送信された").toBe(true);
      });
      await step(4, async () => {
        const got = r as unknown as CsvUploadResult;
        expect.soft(got.上部の成功, "画面上部に「登録が完了しました。」が表示される").toContain("登録が完了しました。");
      });
      await step(5, async () => { 後 = await 数える("手順5"); });
      await expected(async () => {
        expect.soft(前 > 0, `手順1の「SALE中の商品」に商品名「${p.商品名}」が${前に表示 ? "表示される" : "表示されない"}`).toBe(前に表示);
        expect.soft(後 > 0, `手順5の「SALE中の商品」に商品名「${p.商品名}」が${後に表示 ? "表示される" : "表示されない"}`).toBe(後に表示);
      });
    } finally { await ctx.close(); }
  };
}

caseTest("IT-M03-38-043", SALE中への反映("043", false, true));
caseTest("IT-M03-38-044", SALE中への反映("044", true, false));
