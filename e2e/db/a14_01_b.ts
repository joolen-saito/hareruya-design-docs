/** A14-01 の 006・007 の DB の参照。参照だけ。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** フォーマットの名前（番号の小さい順に n 件。削除されていないもの） */
export function 先頭のフォーマット(n: number): { id: string; 名日: string }[] {
  return query(`select id::text as id, name_jp from mtb_format where deleted_at is null order by id limit $1::int`, [n]).map((r) => ({ id: String(r.id), 名日: String(r.name_jp) }));
}

/** カードのカードフォーマット（フォーマットID・制限ID。フォーマットIDの順） */
export function カードのフォーマット(カードID: string): { フォーマット: string; 制限: string }[] {
  return query(`select format_id::text as f, restriction_id::text as r from dtb_card_format where card_id = $1::int order by format_id`, [カードID]).map((r) => ({ フォーマット: String(r.f), 制限: String(r.r) }));
}
