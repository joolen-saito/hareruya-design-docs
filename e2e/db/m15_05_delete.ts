/** M15-05 デッキ削除のDB確認（参照だけ）。 */
import { query } from "../lib/db";

/** デッキに紐づくデッキカードの数 */
export function デッキに紐づくデッキカードの数(デッキID: string): number {
  const r = query("select count(*) as n from dtb_deck_card where deck_id = $1", [デッキID]);
  return Number(r[0]?.n ?? 0);
}
