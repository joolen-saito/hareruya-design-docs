/**
 * A15-15 採用枚数情報参照（デッキビルダーの API）の DB の参照。参照だけ（lib/db.ts は読み取り専用）。
 * 物理名はこのファイルの SQL の中にだけ書き、呼び出す側には業務の言葉の関数名で見せる。
 */
import { query } from "../lib/db";

/** 削除されていないフォーマットのうち、いちばん小さい番号（送り先が有るかの確かめに使う。読むだけ） */
export function 既存のフォーマットの番号(): string {
  const id = query(`select min(id)::text as id from mtb_format where deleted_at is null`)[0]?.id;
  if (!id) throw new Error("削除されていないフォーマットが1件も無い");
  return id;
}

/** そのフォーマットに紐づく、削除されていないアーキタイプのうち、いちばん小さい番号（無ければ null。読むだけ） */
export function 既存のアーキタイプの番号(フォーマットID: string): string | null {
  return query(`select min(id)::text as id from dtb_archetype where format_id = $1::int and deleted_at is null`, [フォーマットID])[0]?.id ?? null;
}
