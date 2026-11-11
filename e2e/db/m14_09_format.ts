/**
 * M14-09 フォーマット一覧のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

export type フォーマットの記録 = { ある: boolean; 削除済み: boolean };

/** フォーマット本体の記録があるか・削除済みか（削除済みでも記録は残る作り） */
export function フォーマットの記録(id: string): フォーマットの記録 {
  const r = query(`select id, (deleted_at is not null) as deleted from mtb_format where id = $1`, [id])[0];
  return r ? { ある: true, 削除済み: r.deleted === "true" } : { ある: false, 削除済み: false };
}

export type 禁止制限の指定 = { フォーマットID: string; 指定: string };

/** そのフォーマットに対して定めた、カードごとの禁止・制限などの指定 */
export function フォーマットの指定(id: string): 禁止制限の指定[] {
  return query(`select cf.format_id, r.name_jp as restriction from dtb_card_format cf join mtb_restriction r on r.id = cf.restriction_id
    where cf.format_id = $1 order by cf.id`, [id]).map((r) => ({ フォーマットID: String(r.format_id), 指定: String(r.restriction) }));
}

/** カード名(英語)がちょうど一致するカードに定めた、フォーマットごとの禁止・制限などの指定 */
export function カードの指定(カード名英: string): 禁止制限の指定[] {
  return query(`select cf.format_id, r.name_jp as restriction from dtb_card_format cf join mtb_card c on c.id = cf.card_id
    join mtb_restriction r on r.id = cf.restriction_id where c.name_en = $1 order by cf.id`, [カード名英])
    .map((r) => ({ フォーマットID: String(r.format_id), 指定: String(r.restriction) }));
}
