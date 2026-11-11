/** F09-04 採用枚数ランキングのDB確認（参照だけ）。物理名はこのファイルの SQL の中だけに書く。 */
import { query } from "../lib/db";

export type 控えた内容 = { デッキ: string[]; 採用カード: string[]; カード: string[] };

/**
 * フォーマットのデッキ（大会の名前・開催日はデッキの項目に持つ）、そのデッキの採用カード、採用されたカードの、
 * 全項目の値を1行ずつの文にして返す（番号の順）。件数は配列の長さ。
 */
export function フォーマットのデッキとカードの全項目(フォーマットの番号: string): 控えた内容 {
  const rows = (sql: string) => query(sql, [フォーマットの番号]).map((r) => r.j ?? "");
  return {
    デッキ: rows("select row_to_json(d)::text as j from dtb_deck d where d.format_id = $1 order by d.id"),
    採用カード: rows("select row_to_json(dc)::text as j from dtb_deck_card dc join dtb_deck d on d.id = dc.deck_id where d.format_id = $1 order by dc.id"),
    カード: rows("select row_to_json(c)::text as j from mtb_card c where c.id in (select dc.card_id from dtb_deck_card dc join dtb_deck d on d.id = dc.deck_id where d.format_id = $1) order by c.id"),
  };
}
