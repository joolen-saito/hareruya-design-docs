/** M14-06 カードセット管理(一覧) のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export function カードセット総数(): number {
  return Number(query(`select count(*) as n from mtb_cardset`)[0].n);
}

export function 略称のカードセットID(略称: string): string | null {
  return query(`select id from mtb_cardset where code = $1 order by id desc limit 1`, [略称])[0]?.id ?? null;
}

export function カードセットの件数(カードセットID: string | number): number {
  return Number(query(`select count(*) as n from mtb_cardset where id = $1`, [カードセットID])[0].n);
}

export function セットの詳細IDs(カードセットID: string | number): string[] {
  return query(`select id from mtb_card_detail where cardset_id = $1 order by id`, [カードセットID]).map((r) => String(r.id));
}

export type セットの画像 = { 画像ID: string; 詳細ID: string; URL: string | null; デッドリンク: boolean };
export function セットの画像(カードセットID: string | number): セットの画像[] {
  return query(`select i.id, i.card_detail_id as d, i.url, i.dead_link_flg from mtb_card_image i join mtb_card_detail d on d.id = i.card_detail_id where d.cardset_id = $1 order by i.id`, [カードセットID])
    .map((r) => ({ 画像ID: String(r.id), 詳細ID: String(r.d), URL: r.url, デッドリンク: r.dead_link_flg === "true" }));
}
