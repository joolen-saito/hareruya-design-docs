/**
 * M07-02 古物台帳入力用CSV出力 の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * シードが控える会員のプレイヤーの番号の読み取りと、実行区分が「ブラウザ+DB確認」のケースの「更新しないこと」の確認に使う。
 */
import { query } from "../lib/db";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}

/** 会員に紐づくプレイヤーの番号（1件のはず） */
export function 会員のプレイヤーID(会員ID: string): string {
  const rows = query("select p.id from dtb_player p where p.customer_id = $1::int order by p.id", [数字(会員ID)]);
  if (rows.length !== 1) throw new Error(`会員 ${会員ID} に紐づくプレイヤーが ${rows.length} 件（1件のはず）`);
  return String(rows[0].id);
}

export type 関連の記録 = {
  買取注文: string[]; 買取明細: string[]; 個別入力商品: string[]; 会員: string[]; プレイヤー: string[];
};

/** 買取注文（と同じ会員の買取注文すべて）・買取明細・個別入力商品・会員・プレイヤーの、行ごとの全項目（更新日時を含む）を文字列にしたもの。件数は配列の長さ */
export function 関連の記録を読む(会員ID: string): 関連の記録 {
  const id = 数字(会員ID);
  const rows = (sql: string): string[] => query(sql, [id]).map((r) => JSON.stringify(r));
  return {
    買取注文: rows("select b.* from dtb_buy_order b where b.customer_id = $1::int order by b.id"),
    買取明細: rows("select m.* from dtb_buy_main_card m join dtb_buy_order b on b.id = m.buy_order_id where b.customer_id = $1::int order by m.id"),
    個別入力商品: rows("select i.* from dtb_buy_order_indivisual_input_product i join dtb_buy_order b on b.id = i.buy_order_id where b.customer_id = $1::int order by i.id"),
    会員: rows("select c.* from dtb_customer c where c.id = $1::int"),
    プレイヤー: rows("select p.* from dtb_player p where p.customer_id = $1::int order by p.id"),
  };
}
