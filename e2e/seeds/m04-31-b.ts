/**
 * M04-31 棚卸計画の続き（082）のシード S-M04-31-QTY20001-082。正本: cases/M04-31_seed_data.tsv
 * 棚卸計画「M0431-082-A」（店舗A・EC-CUBE。実行の印つき）を棚卸計画新規作成画面で登録して棚卸計画IDを控える。
 * 正本の外の補い:
 * - 棚卸詳細（商品コード M0431082N00001〜M0431082N20001 の20001件・在庫数量各1）は作らない。20001件の商品を開発環境に作ることになり、
 *   棚卸商品CSV登録の上限（20000行）と合わせて作れない。棚卸詳細が0件の計画で、「登録が取り消され、計上済み商品数が0」を確かめる。
 * - CSVファイル「m0431-082-over.csv」は、見出し行「商品コード,棚卸数量」に続けて M0431082N00001〜M0431082N20001 を棚卸数量1で並べた20001行を、ケースの中で作る（行数の確認は 数量CSVの行数 で）。
 */
import { expect } from "@playwright/test";
import { planCountByName } from "../db/m04_31_inventory_plan";
import { reportSeedIssue, defineSeed } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { InventoryPlanEditPage, InventoryPlanListPage, InventoryPlanNewPage, topMessages } from "../pages/admin/m04_31_inventory_plan";
import { M0431_ADMIN, 棚卸名, 表示名 } from "./m04-31";

export const 計画名082 = (): string => 棚卸名("082", "A");
/** 082 のシードが登録した棚卸計画のID（シード表は控えると書かないので、控え（notes）には入れず、同じ実行の中だけで持つ） */
let 計画ID082 = "";
export const 計画ID_082 = (): string => 計画ID082;

/** 見出し行＋データ20001行（商品コード M0431082N00001〜M0431082N20001・棚卸数量1） */
export function 数量CSV20001(): string {
  const rows = ["商品コード,棚卸数量"];
  for (let i = 1; i <= 20001; i++) rows.push(`M0431082N${String(i).padStart(5, "0")},1`);
  return rows.join("\n") + "\n";
}

defineSeed("S-M04-31-QTY20001-082", { needs: ["S-M04-31-ADM"] }, async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const name = 計画名082();
  if (planCountByName(name) > 0) throw new Error(`${seed.シードID}: 棚卸名 ${name} の棚卸計画が前の実行から残っている（削除の画面が無いので止めた）`);
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
    issue(`棚卸計画「${name}」（棚卸計画ID ${id}・店舗A・EC-CUBE）を登録した。補い: 棚卸詳細20001件（商品20001件）は作れないので作らず、棚卸詳細0件の計画にした。CSVの20001行はケースの中で作る`);
  });
});
