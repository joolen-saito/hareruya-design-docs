/**
 * M07-07 買取商品一覧（キャンセル）CSV出力。正本: cases/M07-07_test_cases.tsv
 *
 * 画面だけで準備できるのは、買取情報が存在しないことだけを使う 011 の1件（記録 review/M07-07_progress_2026-11-02.md）。
 * ほかのケースは、カード商品の買取明細を持つ買取情報（カード詳細の指定・商品規格の登録・ネット買取の申込・売却しない明細の作成）が要る。
 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BuyListPage } from "../../pages/admin/m07_buy";
import { M0707_ADMIN } from "../../seeds/m07-07";

caseTest("IT-M07-07-011", async ({ page, step, expected }) => {
  const l = new BuyListPage(page);
  await step(1, async () => { await loginAdmin(page, M0707_ADMIN); });
  await step(2, async () => { await l.open(); await l.買取番号を入れる("7077111"); await l.検索する(); });
  await step(3, async () => { await expect(l.検索フォーム(), "検索結果の画面").toBeVisible(); });
  await expected(async () => {
    expect.soft((await l.行()).length, "買取番号7077111の検索結果の行数").toBe(0);
    await expect.soft(l.ダウンロードのボタン(), "「ダウンロード▼」が表示されない").toHaveCount(0);
    await expect.soft(page.getByRole("button", { name: "買取商品（キャンセル）CSV" }), "「買取商品（キャンセル）CSV」が表示されない").toHaveCount(0);
  });
});
