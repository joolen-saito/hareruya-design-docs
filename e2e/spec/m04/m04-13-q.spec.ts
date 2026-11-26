/**
 * M04-13 在庫分割登録が公開側の商品詳細の在庫へ届くこと（097）。正本: cases/M04-13_test_cases.tsv
 * ブラウザA＝管理画面（ケースの page）、ブラウザB＝公開側（ケースの中で開く新しいブラウザ。日本語・PC・ログアウト）。
 */
import { test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { searchStockList, stockRow } from "../../pages/admin/m04_13_setup";
import { SplitNewPage, splitNewPathRe } from "../../pages/admin/m04_13_split_join";
import { FrontDetail, 店 } from "../../pages/front/f03_02_detail";
import { m0413QE097 } from "../../seeds/m04-13-q";
import { 試験所属 } from "../../seeds/m04-21-q";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-M04-13-097", async ({ page, browser, notes, step, expected }) => {
  const d = m0413QE097();
  const id = notes.get("〔商品ID-M0413-001〕");
  const b = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  await hideDebugToolbar(b);
  const detail = new FrontDetail(await b.newPage());
  supplement(`事前準備②の申請者・承認者の所属は所属のマスタの既存の「${試験所属}」にした。商品コード・商品名には実行の印が付く`);
  const NMの在庫 = async (when: string): Promise<string> => {
    const rows = await detail.行の文();
    note(`${when}: ブラウザBの商品詳細（商品ID ${id}）の価格・在庫の表: ${rows.map((r) => `${r.状態}・${r.価格}・在庫${r.在庫}`).join(" / ") || "（行が無い）"}`);
    const nm = rows.filter((r) => /^(NM|ニアミント)/.test(r.状態));
    return (nm[0] ?? rows[0])?.在庫.replace(/[^0-9]/g, "") ?? "";
  };
  let 前 = "", 後 = "";
  try {
    await step(1, async () => {
      const res = await detail.open(店.本店, id);
      expect(res?.status() ?? 0, "ブラウザBの商品詳細の応答").toBeLessThan(400);
      前 = await NMの在庫("手順1");
    });
    await step(2, async () => { await loginAdmin(page, d.申請者.account); });
    await step(3, async () => { await searchStockList(page, { store: d.本店名, zone: "EC-CUBE", code: d.商品コード }); });
    await step(4, async () => {
      const row = stockRow(page, d.商品コード, d.本店名, "EC-CUBE");
      await expect(row, `在庫検索一覧の ${d.商品コード}（EC-CUBE）の行が1件`).toHaveCount(1);
      await row.locator('input[name="productStockIds[]"]').check();
      const button = page.locator("#stockSplitBtn");
      await expect(button, "「在庫分割登録」ボタン").toBeEnabled();
      await Promise.all([page.waitForURL((u) => splitNewPathRe.test(u.pathname), { waitUntil: "load", timeout: 30_000 }), button.click()]);
    });
    await step(5, async () => {
      const id分割 = await new SplitNewPage(page).register("4", null, "分割数4の登録");
      note(`登録で採番された在庫分割結合ID: ${id分割}`);
    });
    await step(6, async () => {
      await detail.open(店.本店, id);
      後 = await NMの在庫("手順6");
    });
    await expected(async () => {
      expect.soft(前, "手順1の商品詳細の在庫の項目（数字）").toBe("10");
      expect.soft(後, "手順6（分割の登録後）の商品詳細の在庫の項目（数字）").toBe("6");
    });
  } finally { await b.close(); }
});
