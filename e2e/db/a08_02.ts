/**
 * A08-02 指定言語の設定済みトップバナー一覧の取得の DB の参照。参照だけ（lib/db.ts は読み取り専用）。
 * 物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

export type 言語の行 = { 番号: string; 名日: string; 名英: string };

/** 言語コードの言語（無ければ null） */
export function 言語を探す(コード: string): 言語の行 | null {
  const r = query(`select id::text as id, name_jp, name_en from mtb_language where code = $1 order by id`, [コード]);
  if (r.length > 1) throw new Error(`言語コード「${コード}」の言語が ${r.length} 件ある（1件のはず）`);
  return r.length ? { 番号: String(r[0].id), 名日: String(r[0].name_jp), 名英: String(r[0].name_en) } : null;
}

/** 言語に紐づくトップバナーの数（紐づけの数。表示対象かどうかは問わない） */
export function 紐づくトップバナーの数(コード: string): number {
  return Number(query(
    `select count(*)::text as n from dtb_top_banner_language bl join mtb_language l on l.id = bl.language_id where l.code = $1`, [コード],
  )[0]?.n ?? "0");
}
