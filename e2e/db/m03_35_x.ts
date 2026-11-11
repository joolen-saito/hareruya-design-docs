/**
 * M03-35 部門更新CSV登録の続き（-x）の照会（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { count, query } from "../lib/db";

export type 部門 = { 部門ID: string; 部門コード: string; 部門名: string; 表示: boolean; スマレジ連携: boolean };

/** 部門コードの部門（無ければ null）。部門更新CSVの取込は、部門を部門コードで探し、スマレジの部門と対応付いた部門だけを受け付ける */
export function 部門コードの部門(部門コード: string): 部門 | null {
  const r = query(
    `select s.id::text as id, s.code::text as code, s.name as name, s.visible::text as v,
            (s.smaregi_category_id is not null and trim(s.smaregi_category_id) <> '')::text as smr
       from mtb_section s where s.code::text = $1 order by s.id`, [部門コード]);
  if (r.length > 1) throw new Error(`部門コード ${部門コード} の部門が ${r.length} 件ある`);
  if (r.length === 0) return null;
  return { 部門ID: r[0].id ?? "", 部門コード: r[0].code ?? "", 部門名: r[0].name ?? "", 表示: r[0].v === "true", スマレジ連携: r[0].smr === "true" };
}

/** 部門IDまたは部門コードが値に当たる部門の数（未登録の部門コードであることを確かめる） */
export function 部門IDか部門コードが当たる部門の数(値: string): number {
  return count(`select s.id from mtb_section s where s.code::text = $1 or s.id::text = $1`, [値]);
}

/** 商品コードの商品規格（商品規格IDの順）と部門ID */
export function 商品コードの規格の部門(商品コード: string): { 商品規格ID: string; 部門ID: string | null }[] {
  return query(
    `select pc.id::text as id, pc.section_id::text as sid from dtb_product_class pc where pc.product_code = $1 order by pc.id`, [商品コード],
  ).map((r) => ({ 商品規格ID: r.id ?? "", 部門ID: r.sid }));
}

/** 商品コードの商品規格の数（未登録であることを確かめる） */
export function 商品コードの規格の数(商品コード: string): number {
  return count(`select pc.id from dtb_product_class pc where pc.product_code = $1`, [商品コード]);
}

/** 部門更新CSVの取込履歴のうち、ファイル名がちょうど name の行の数 */
export function 部門更新の取込履歴の数(name: string): number {
  return count(`select h.id from dtb_csv_import_history h
    join mtb_csv_import_type t on t.id = h.csv_import_type_id
    where t.name = $1 and h.file_name = $2`, ["部門更新登録", name]);
}
