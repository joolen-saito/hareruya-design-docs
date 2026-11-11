/** M15-05 デッキ編集のDB確認（参照だけ）。物理名はこのファイルの SQL の中だけに書く。 */
import { query } from "../lib/db";

/** デッキに紐づくデッキカード（カード名(英)・枚数）。明細の順 */
export function デッキカード(デッキID: string): { カード名英: string; 枚数: number }[] {
  return query(
    "select c.name_en as n, dc.count as k from dtb_deck_card dc left join mtb_card c on c.id = dc.card_id where dc.deck_id = $1 order by dc.id",
    [デッキID],
  ).map((r) => ({ カード名英: r.n ?? "", 枚数: Number(r.k) }));
}
