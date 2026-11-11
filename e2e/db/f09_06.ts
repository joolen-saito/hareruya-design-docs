/** F09-06 デッキリスト詳細のDB確認（参照だけ）。物理名はこのファイルの SQL の中だけに書く。 */
import { query } from "../lib/db";

export type 行数と更新日時 = { デッキ: number; 大会: number; アーキタイプ: number; 採用カード: number; このデッキの更新日時: string };

/** デッキ・大会・アーキタイプ・採用カードの各行数と、指定のデッキの更新日時 */
export function 行数と更新日時(デッキID: string): 行数と更新日時 {
  const r = query(
    `select (select count(*) from dtb_deck) as deck, (select count(*) from dtb_event) as event,
            (select count(*) from dtb_archetype) as archetype, (select count(*) from dtb_deck_card) as deck_card,
            (select update_date::text from dtb_deck where id = $1::int) as updated`,
    [デッキID],
  )[0];
  return {
    デッキ: Number(r.deck), 大会: Number(r.event), アーキタイプ: Number(r.archetype), 採用カード: Number(r.deck_card),
    このデッキの更新日時: r.updated ?? "",
  };
}
