/** M14-08 カードセット詳細(登録・編集・削除)のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type カードセットの値 = { カードセットID: string; 名日: string; 名英: string; 略称: string; ブロック: string | null; リリース日: string | null; 特殊セット: boolean; シンボル画像: string | null };

export function カードセットの値(id: string | number): カードセットの値 | null {
  const r = query(`select s.id, s.name_jp, s.name_en, s.code, b.name_jp as block, (s.release_date at time zone 'Asia/Tokyo')::date::text as rd, s.special_flg, s.symbol_image
    from mtb_cardset s left join mtb_cardsetblock b on b.id = s.cardsetblock_id where s.id = $1`, [id])[0];
  if (!r) return null;
  return { カードセットID: String(r.id), 名日: String(r.name_jp), 名英: String(r.name_en), 略称: String(r.code), ブロック: r.block, リリース日: r.rd, 特殊セット: r.special_flg === "true", シンボル画像: r.symbol_image };
}

/** 名称（日本語）が一致するカードセットの件数 */
export function 名称のカードセット件数(名日: string): number {
  return Number(query(`select count(*) as n from mtb_cardset where name_jp = $1`, [名日])[0].n);
}
