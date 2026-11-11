/**
 * M03-19 部門CSV出力の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 部門のマスタは全員が使うので、行を足したり書き換えたりしない（開発環境に既にある部門で読み替える）。
 */
import { query } from "../lib/db";

export type 部門の値 = { ID: string; 部門名: string; 部門コード: string; 免税区分: string; MTGBuyer表示フラグ: string };

/** 部門の全件（部門コード・ID の順）。MTGBuyer表示フラグは CSV と同じく 1／0 */
export function 部門の一覧(): 部門の値[] {
  return query(
    `select s.id::text as id, coalesce(s.name, '') as nm, coalesce(s.code::text, '') as cd, coalesce(s.tax_free_division::text, '') as tf,
            case when s.visible then '1' else '0' end as vis
       from mtb_section s order by s.code, s.id`).map((r) => ({ ID: r.id ?? "", 部門名: r.nm ?? "", 部門コード: r.cd ?? "", 免税区分: r.tf ?? "", MTGBuyer表示フラグ: r.vis ?? "" }));
}

/** 部門ID の値（無ければ null） */
export function 部門の(id: string): 部門の値 | null {
  return 部門の一覧().find((x) => x.ID === id) ?? null;
}
