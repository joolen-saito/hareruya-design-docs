/** M12-09・M12-10 のシードが、画面に出ない番号（デッキ内カード明細ID）を控えるための参照。参照（SELECT）だけ。 */
import { query } from "../lib/db";

/** デッキに入っているカードの明細ID（デッキIDとカードIDで1件に決まるときだけ返す） */
export function デッキ内カード明細ID(デッキID: string, カードID: string): string {
  const rows = query("select id from dtb_deck_card where deck_id = $1 and card_id = $2 order by id", [デッキID, カードID]);
  if (rows.length !== 1) throw new Error(`デッキID ${デッキID} のカードID ${カードID} の明細が ${rows.length} 件ある（1件のはず）`);
  return rows[0].id as string;
}

/** 集計の対象になるデータ（デッキ・デッキ内のカード・カード・商品・商品規格）の全レコードと値。前後で比べるために1つの文字列にして返す */
export function 集計対象の記録(デッキID: string[], カードID: string[], 商品ID: string[]): string {
  const part = (sql: string, ids: string[]) => ids.flatMap((id) => query(sql, [id]).map((r) => r.r as string));
  return JSON.stringify({
    デッキ: part("select to_jsonb(t)::text as r from dtb_deck t where t.id = $1", デッキID),
    デッキ内カード: part("select to_jsonb(t)::text as r from dtb_deck_card t where t.deck_id = $1 order by t.id", デッキID),
    カード: part("select to_jsonb(t)::text as r from mtb_card t where t.id = $1", カードID),
    商品: part("select to_jsonb(t)::text as r from dtb_product t where t.id = $1", 商品ID),
    商品規格: part("select to_jsonb(t)::text as r from dtb_product_class t where t.product_id = $1 order by t.id", 商品ID),
  });
}
