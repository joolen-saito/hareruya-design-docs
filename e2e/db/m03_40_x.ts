/**
 * M03-40 棚番号更新CSV登録の続き（-x）の照会（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { count, query } from "../lib/db";

/** 棚番号の名前が、棚番号のマスタに何件あるか */
export function 棚番号の名前の数(名前: string): number {
  return count(`select s.id from dtb_shelf_number s where s.name = $1`, [名前]);
}

/** 商品コードの商品規格（商品規格IDの順）と、付いている棚番号の名前 */
export function 商品コードの規格の棚番号(商品コード: string): { 商品規格ID: string; 棚番号: string | null }[] {
  return query(
    `select pc.id::text as id, s.name as shelf
       from dtb_product_class pc left join dtb_shelf_number s on s.id = pc.shelf_number_id
      where pc.product_code = $1 order by pc.id`, [商品コード],
  ).map((r) => ({ 商品規格ID: r.id ?? "", 棚番号: r.shelf }));
}

/** 商品コードの商品規格の数（未登録であることを確かめる） */
export function 商品コードの規格の数(商品コード: string): number {
  return count(`select pc.id from dtb_product_class pc where pc.product_code = $1`, [商品コード]);
}

export type 取込履歴 = { 種別: string; ファイル名: string; 取込日時: string; 作業者: string };

/** 棚番号更新CSVの取込履歴のうち、ファイル名がちょうど name の行（古い順） */
export function 棚番号更新の取込履歴(name: string): 取込履歴[] {
  return query(
    `select t.name as type, h.file_name as fn, to_char(h.create_date, 'YYYY-MM-DD HH24:MI:SS') as at, m.name as member
       from dtb_csv_import_history h
       join mtb_csv_import_type t on t.id = h.csv_import_type_id
       left join dtb_member m on m.id = h.member_id
      where t.name = $1 and h.file_name = $2 order by h.id`, ["棚番号更新", name],
  ).map((r) => ({ 種別: r.type ?? "", ファイル名: r.fn ?? "", 取込日時: r.at ?? "", 作業者: r.member ?? "" }));
}

/**
 * 商品規格の行と、その商品の行の全項目（棚番号の列は除く）。取込の前後で、棚番号のほかが変わらないことを比べる。
 * 値は文字にした JSON（列の順は DB の並び）。
 */
export function 規格と商品の項目(商品規格ID: string): { 規格: string; 商品: string } {
  const r = query(
    `select (to_jsonb(pc) - 'shelf_number_id')::text as pc, to_jsonb(p)::text as p
       from dtb_product_class pc join dtb_product p on p.id = pc.product_id where pc.id = $1::int`, [商品規格ID])[0];
  if (!r) throw new Error(`商品規格ID ${商品規格ID} の商品規格が無い`);
  return { 規格: r.pc ?? "", 商品: r.p ?? "" };
}
