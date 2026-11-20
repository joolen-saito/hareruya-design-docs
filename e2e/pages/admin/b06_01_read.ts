/**
 * B06-01 の管理画面の読み取り。在庫検索一覧の在庫・原価単価・総原価と、在庫履歴検索一覧の行（見出しの文言で引く）。
 * 検索は F04-04 の部品（在庫を検索する・在庫履歴を検索する）を使う。セレクタはここだけに書く。
 */
import { HistoryRow, StockHistoryPage } from "./m04_17_stock_history";
import { StockListPage } from "./stock_edit";

const 数 = (t: string): number => {
  const v = t.replace(/[,\s円￥¥]/g, "");
  if (!/^-?\d+$/.test(v)) throw new Error(`数を読めない: 「${t}」`);
  return Number(v);
};

/** 在庫検索一覧(検索結果)の行（コード・店舗・EC-CUBE）の在庫・原価単価・総原価。行が1件でなければ値は null */
export async function 在庫の行を読む(list: StockListPage, 商品コード: string, 店舗: string): Promise<{ 行の数: number; 在庫: number | null; 原価単価: number | null; 総原価: number | null }> {
  const row = list.row(商品コード, 店舗, "EC-CUBE");
  const n = await row.count();
  if (n !== 1) return { 行の数: n, 在庫: null, 原価単価: null, 総原価: null };
  // 2つ目の価格の欄は「買取価格／原価単価」、在庫の欄は「在庫／総原価」の2段
  const 価格 = (await row.locator("td.col-price").nth(1).locator(":scope > div").allInnerTexts()).map((t) => t.trim());
  const 在庫 = (await row.locator("td.col-stock > div").allInnerTexts()).map((t) => t.trim());
  return { 行の数: 1, 在庫: 数(在庫[0] ?? ""), 原価単価: 数(価格[1] ?? ""), 総原価: 数(在庫[1] ?? "") };
}

/** 在庫履歴の一覧の見出し（画面の文言）と、ケースの項目名の対応。ケースの「在庫増減数」は一覧の「在庫変動数」 */
const 見出し: Record<string, string> = {
  店舗: "店舗", 変更前在庫: "変更前在庫", 変更後在庫: "変更後在庫", 在庫増減数: "在庫変動数", 仕入単価: "仕入単価",
  変更前原価単価: "変更前原価単価", 変更後原価単価: "変更後原価単価", 変更前総原価: "変更前総原価", 変更後総原価: "変更後総原価", 登録者: "登録者",
};
export type 履歴の項目 = keyof typeof 見出し;

/** 在庫履歴検索一覧(検索結果)の行を、ケースの項目名で読む（数の項目は数に直す） */
export async function 在庫履歴の行を読む(h: StockHistoryPage): Promise<Record<string, string | number>[]> {
  const rows: HistoryRow[] = await h.rows();
  return rows.map((r) => {
    const out: Record<string, string | number> = {};
    for (const [項目, 文言] of Object.entries(見出し)) {
      const k = Object.keys(r).find((x) => x === 文言) ?? Object.keys(r).find((x) => x.startsWith(文言));
      if (!k) throw new Error(`在庫履歴の一覧に「${文言}」の列が無い（列: ${Object.keys(r).join("、")}）`);
      out[項目] = ["店舗", "登録者"].includes(項目) ? r[k].trim() : 数(r[k]);
    }
    return out;
  });
}
