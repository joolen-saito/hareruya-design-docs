/**
 * M04-33・M04-34 のシードの入庫。在庫変更CSV登録をしたあと、別のメンバーが在庫編集承認一覧で承認する。
 * 手順は seeds/m04-25.ts の stockInByCsv と同じ。違うのは、承認一覧を「今回の行の絞り込みの値（?id=）」で開くところだけ（F04 の共通のシードと同じやり方）。
 * 本店（店舗ID 1）は前の実行の未承認の行が多く、店舗で絞った一覧の1ページ目に今回の行が出ない。
 * 2026-11-14 の夜の回では、このために M04-34 の11件が「未承認の行が無い」で止まった。店舗ID 5・13 では出ていた。
 * stockInByCsv はほかの機能（M04-25 など）も使うので変えず、ここに足す。
 */
import { Browser } from "@playwright/test";
import { 在庫承認の最大ID } from "../../db/f03_08";
import { 未承認の行の絞り込みの値 } from "../../db/f04_setup";
import { adminUrl, withAdminSession } from "../../lib/session";
import { reportSeedIssue } from "../../lib/seeds";
import type { Actor } from "../../seeds/m04-25";
import { registerStockChangeCsv } from "./m04_19_stock_change_csv";
import { StockApprovalListPage } from "./stock_edit";

export async function 入庫して承認する(browser: Browser, seedId: string, v: {
  registrant: Actor; approver: Actor; 店舗ID: string; 店名: string; 行: { 商品コード: string; 在庫増減数: number; 仕入単価: number }[];
}): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const baseline = 在庫承認の最大ID();
  await withAdminSession(browser, v.registrant.account, (page) => registerStockChangeCsv(page, {
    店舗: v.店名, 店舗ID: v.店舗ID, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/その他", 在庫変動理由: `${seedId}試験用`, 承認者: v.approver.名前,
    行: v.行.map((r) => ({ 商品コード: r.商品コード, 在庫増減数: String(r.在庫増減数), 仕入単価: String(r.仕入単価) })),
    ファイル名: `${seedId.toLowerCase()}-stock-${Date.now()}.csv`,
  }, `${seedId}: 在庫変更CSV登録（${v.行.length}行）`, issue));
  const total = v.行.reduce((s, r) => s + r.在庫増減数, 0);
  const srcs = 未承認の行の絞り込みの値(baseline, v.registrant.名前, total);
  if (srcs.length === 0) throw new Error(`${seedId}: 在庫変更CSV登録のあと、${v.registrant.名前} の未承認の行（合計 ${total}）が DB に無い（店舗ID ${v.店舗ID}）`);
  await withAdminSession(browser, v.approver.account, async (page) => {
    await page.goto(adminUrl(`/product/stock/approval_list?id=${srcs[0]}`), { timeout: 60_000 });
    await page.waitForLoadState("load");
    const list = new StockApprovalListPage(page);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === v.registrant.名前
      && Number(r.id) > baseline && r.changeType.endsWith("入庫/その他") && r.quantity === String(total));
    if (rows.length === 0) throw new Error(`${seedId}: 在庫編集承認一覧（?id=${srcs[0]}）に、${v.registrant.名前} の在庫変更CSV登録（合計 ${total}）の未承認の行が無い`);
    // 2026-11-17 のアプリの直し（ECCUBE_HARERUYA-4094。在庫承認の検索で店舗が必須）のあと、「?id=」で開いた一覧は検索欄の店舗が空のままで、
    // 「一括承認」がブラウザの入力チェックで止まり、確認のモーダルが開かない（11/18 M04-33・34 の23件）。店舗を選ぶだけにする（検索はしない）
    if (await list.ensureShopChosen(v.店名)) issue(`在庫編集承認一覧（?id=${srcs[0]}）の検索欄の店舗が空だったので「${v.店名}」を選んでから一括承認した（検索はしていない）`);
    if (!rows[0].shop.startsWith(v.店名)) issue(`在庫編集承認一覧の行の店舗の表示が「${rows[0].shop}」（店名「${v.店名}」で始まらない）。DB の絞り込みの値で開いた行を承認した`);
    await list.approve([rows[0].id], `${seedId}: 在庫変更CSV登録の承認`, issue);
  });
}
