/**
 * A15-07 アーキタイプ検索の DB の参照。参照だけ（lib/db.ts は読み取り専用）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

/** 表示区分（公開状態）の名称（無ければ null） */
export function 表示区分の名称(番号: number): string | null {
  const r = query(`select name from mtb_disp where id = $1::int`, [番号]);
  return r.length ? String(r[0].name) : null;
}

/** フォーマットに紐づく、削除されていないアーキタイプの識別子（昇順） */
export function フォーマットのアーキタイプ(フォーマット番号: string): { 番号: string; 名日: string; 名英: string; 表示区分: string }[] {
  return query(
    `select id::text as id, name_jp, name_en, coalesce(disp_id::text, '') as disp from dtb_archetype where format_id = $1::int and deleted_at is null order by id`,
    [フォーマット番号],
  ).map((r) => ({ 番号: String(r.id), 名日: String(r.name_jp), 名英: String(r.name_en), 表示区分: String(r.disp) }));
}
