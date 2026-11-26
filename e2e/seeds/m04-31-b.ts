/**
 * M04-31 棚卸計画の続き（082）のシード S-M04-31-QTY20001-082。正本: cases/M04-31_seed_data.tsv
 * 棚卸計画「M0431-082-A」（店舗A・EC-CUBE。実行の印つき）を棚卸計画新規作成画面で登録して棚卸計画IDを控える。
 * 正本の外の補い:
 * - 棚卸詳細は商品コード M0431082N00001〜M0431082N20001 の20001件（在庫数量各1）だが、20001件の商品は開発環境に作れず、棚卸商品CSV登録の上限（20000行）とも合わせられない。
 *   読み替え: 実行の印つきの商品1件（M0431082N00001 に印）をグッズ商品CSV登録で作り、棚卸商品CSV登録で棚卸詳細1件（棚卸数量は空）として計画に入れる（理由: 画面は棚卸詳細0件だと「数量登録」ボタンを無効にする）。
 * - CSVファイル「m0431-082-over.csv」は、見出し行「商品コード,棚卸数量」に続けて M0431082N00001〜M0431082N20001 を棚卸数量1で並べた20001行を、ケースの中で作る。先頭のデータ行の商品コードは入れた詳細の商品（印つき）にする。
 */
import { expect } from "@playwright/test";
import { planCountByName } from "../db/m04_31_inventory_plan";
import { reportSeedIssue, defineSeed } from "../lib/seeds";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { createGoodsProduct } from "../pages/admin/m04_31_seed_ops";
import { expectNoProductCodes } from "../pages/admin/m04_17_seed_ops";
import { InventoryPlanEditPage, InventoryPlanListPage, InventoryPlanNewPage, topMessages } from "../pages/admin/m04_31_inventory_plan";
import { M0431_ADMIN, 棚卸名, 表示名 } from "./m04-31";

export const 計画名082 = (): string => 棚卸名("082", "A");
/** 082 のシードが登録した棚卸計画のID（シード表は控えると書かないので、控え（notes）には入れず、同じ実行の中だけで持つ） */
let 計画ID082 = "";
export const 計画ID_082 = (): string => 計画ID082;

/** 入れた棚卸詳細の商品（M0431082N00001 に実行の印）。同じ実行の中だけで使う */
export const 商品コード082 = (): string => rc("M0431082N00001");
const 商品名082 = (): string => rc("M0431-082-NAME");

/** 見出し行＋データ20001行（M0431082N00001〜M0431082N20001・棚卸数量1。先頭行は入れた詳細の商品〔印つき〕） */
export function 数量CSV20001(): string {
  const rows = ["商品コード,棚卸数量"];
  for (let i = 1; i <= 20001; i++) rows.push(`${i === 1 ? 商品コード082() : `M0431082N${String(i).padStart(5, "0")}`},1`);
  return rows.join("\n") + "\n";
}

defineSeed("S-M04-31-QTY20001-082", { needs: ["S-M04-31-ADM"] }, async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const name = 計画名082();
  if (planCountByName(name) > 0) throw new Error(`${seed.シードID}: 棚卸名 ${name} の棚卸計画が前の実行から残っている（削除の画面が無いので止めた）`);
  const code = 商品コード082();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await expectNoProductCodes(page, [code], seed.シードID);
    await createGoodsProduct(page, { 商品コード: code, 商品名: 商品名082(), 商品名英: `${商品名082()}-EN`, 基準価格: "1", 販売価格: "1", 買取価格: "1", 原価単価: "1" }, seed.シードID, issue);
  });
  await withAdminSession(browser, M0431_ADMIN, async (page) => {
    const list = new InventoryPlanListPage(page);
    await list.open();
    await list.pressNew();
    const form = new InventoryPlanNewPage(page);
    await form.fill({ 棚卸名: name, 店舗: 表示名("店舗A"), 在庫区分: "EC-CUBE" });
    if ((await form.submit()) !== "送信") throw new Error(`${seed.シードID}: 棚卸計画の登録がブラウザの入力チェックで止まった: ${(await form.invalidFields()).join(" / ")}`);
    const id = new InventoryPlanEditPage(page).planIdInUrl();
    const m = await topMessages(page);
    if (!id || m.エラー.length) throw new Error(`${seed.シードID}: 棚卸計画を登録できない（${page.url()}・${m.エラー.join(" / ")}）`);
    expect(await new InventoryPlanEditPage(page).name(), "登録後の棚卸名").toBe(name);
    計画ID082 = id;
    const edit = new InventoryPlanEditPage(page);
    await edit.uploadCsv("商品登録", { name: `${seed.シードID}-items.csv`, body: `商品コード\n${code}\n` }, `${seed.シードID} の棚卸商品CSV登録`, issue);
    const rows = await edit.detailRows();
    expect(rows.map((r) => ({ 商品コード: r["商品コード"], 棚卸数量: (r["棚卸数量"] ?? "").trim() })), `${seed.シードID}: 棚卸詳細は1件・棚卸数量は空`).toEqual([{ 商品コード: code, 棚卸数量: "" }]);
    issue(`棚卸計画「${name}」（棚卸計画ID ${id}・店舗A・EC-CUBE）を登録した。補い（正本の外）: 棚卸詳細20001件（商品20001件）は作れないので、実行の印つきの商品1件（${code}）の棚卸詳細1件（棚卸数量は空）にした。詳細0件だと「数量登録」ボタンが無効になるため。CSVの20001行はケースの中で作る`);
  });
});
