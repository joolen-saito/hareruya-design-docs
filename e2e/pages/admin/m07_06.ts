/**
 * M07-06 買取商品一覧CSV出力 の画面操作（セレクタはここにだけ書く）。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 買取検索一覧の「買取詳細」欄は、買取明細ごとに「商品名（左）／数量（右）」の行と、最後に「申込時買取金額合計:」の行が並ぶ。
 * - 買取情報編集の「買取商品一覧CSV出力」ボタンは、その買取だけを対象にCSVをダウンロードする（送信の応答がファイルになる）。
 * - 買取明細の売却は、買取情報編集の「査定編集」で選び、「査定確定」→「保存」で確定する（選択肢は「する」「しない」）。
 */
import { Download, expect, Page } from "@playwright/test";
import { BuyEditPage, BuyListPage } from "./m07_buy";

const OPEN = 30_000;

export type 詳細の行 = { 商品名: string; 数量: string };

/** 買取検索一覧(検索結果)の、買取番号（数字）の行の「買取詳細」欄の、買取明細ごとの商品名・数量 */
export async function 一覧の買取詳細(page: Page, 番号: string): Promise<詳細の行[]> {
  const cell = page.locator(`#result_list_main__purchase_purchase_detail--${Number(番号)}`);
  await expect(cell, `一覧の買取番号 ${番号} の「買取詳細」欄`).toBeVisible({ timeout: OPEN });
  const rows = await cell.locator(":scope > .row").evaluateAll((els) => els.map((e) => {
    const cols = Array.from(e.children).map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim());
    return { 商品名: cols[0] ?? "", 数量: cols[1] ?? "" };
  }));
  return rows.filter((r) => !r.商品名.startsWith("申込時買取金額合計"));
}

/** 買取情報編集の「買取商品一覧CSV出力」ボタンを押し、ダウンロードされたファイルを返す（出なければ null） */
export async function 編集画面からCSVを出す(page: Page): Promise<Download | null> {
  const btn = page.locator("#csvexport_product_list");
  await expect(btn, "買取情報編集の「買取商品一覧CSV出力」ボタン").toBeVisible({ timeout: OPEN });
  const download = page.waitForEvent("download", { timeout: 30_000 }).catch(() => null);
  await btn.click({ timeout: OPEN, noWaitAfter: true });
  return download;
}

/** 買取番号の買取情報編集を開き、査定編集で明細（商品名）ごとの売却を選び、査定確定・保存する（シードの作り方） */
export async function 売却を明細ごとに設定する(page: Page, 買取番号: string, 設定: { 名前: string; 売却: "売却する" | "売却しない" }[]): Promise<void> {
  const list = new BuyListPage(page);
  await list.open();
  await list.買取番号を入れる(String(Number(買取番号)));
  await list.検索する();
  await list.編集画面を開く(買取番号);
  const edit = new BuyEditPage(page);
  await edit.査定編集を始める();
  for (const s of 設定) await edit.明細を名前で入れる(s.名前, { 売却: s.売却 });
  await edit.査定確定する();
  await edit.保存する(`買取番号 ${買取番号} の買取明細の売却（${設定.map((s) => `${s.名前}→${s.売却}`).join("、")}）`);
}
