/** 略称タグ更新CSV登録のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { count, query } from "../lib/db";

/** 商品IDの商品の略称タグID（略称タグが無ければ空文字。商品が無ければ null） */
export function 商品の略称タグID(商品ID: string): string | null {
  const rows = query("select coalesce(storage_code_id::text, '') as \"略称タグID\" from dtb_product where id = $1", [商品ID]);
  return rows.length ? rows[0].略称タグID ?? "" : null;
}

/** 種別が「略称タグ更新」の取込履歴の件数 */
export function 略称タグ更新の取込履歴の件数(): number {
  return count(`select h.id from dtb_csv_import_history h join mtb_csv_import_type t on t.id = h.csv_import_type_id where t.name = '略称タグ更新'`);
}

/** 種別が「略称タグ更新」で、ファイル名が name の取込履歴の件数 */
export function 略称タグ更新の同名の取込履歴の件数(name: string): number {
  return count(`select h.id from dtb_csv_import_history h join mtb_csv_import_type t on t.id = h.csv_import_type_id where t.name = '略称タグ更新' and h.file_name = $1`, [name]);
}

/** 略称タグIDの略称タグが何件保存されているか（削除されていれば0） */
export function 略称タグの件数(略称タグID: string): number {
  return count("select id from mtb_storage_code where id = $1", [略称タグID]);
}
