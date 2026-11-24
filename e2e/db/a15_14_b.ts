/**
 * A15-14 メタゲーム情報参照の 018（アーキタイプの代表カード画像）の DB の参照（読むだけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

/** アーキタイプの代表カードの画像URL（無ければ空） */
export function アーキタイプの代表カード画像(アーキタイプ番号: string): string {
  return String(query(
    `select coalesce(ci.url, '') as url from dtb_archetype a left join mtb_card_image ci on ci.id = a.card_image_id where a.id = $1::int`,
    [アーキタイプ番号])[0]?.url ?? "");
}
