/** M15-05 デッキ編集のDB確認（参照だけ）。 */
import { query } from "../lib/db";

/** デッキに紐づくデッキカード（カード名(英)と枚数。明細の順） */
export function デッキカードの明細(デッキID: string): { カード名英: string; 枚数: number }[] {
  return query("select c.name_en as n, dc.count as k from dtb_deck_card dc join mtb_card c on c.id = dc.card_id where dc.deck_id = $1 order by dc.id", [デッキID])
    .map((r) => ({ カード名英: r.n!, 枚数: Number(r.k) }));
}
