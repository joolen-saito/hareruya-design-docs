/** 商品タグと商品タグ更新の取込履歴のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 取込種別「商品タグ更新登録」の取込種別ID（取込種別のマスタの名称で引く） */
const PRODUCT_TAG_IMPORT = `(select id from mtb_csv_import_type where name = '商品タグ更新登録')`;

export type 商品タグの行 = { タグID: string; 登録者ID: string | null };

/** 商品の商品タグ（登録の順＝紐付けの番号の順） */
export function 商品の商品タグ(商品ID: string): 商品タグの行[] {
  return query(`select tag_id as "タグID", creator_id as "登録者ID" from dtb_product_tag where product_id = $1 order by id`, [商品ID])
    .map((r) => ({ タグID: r.タグID ?? "", 登録者ID: r.登録者ID }));
}

export type 取込履歴 = { 履歴ID: string; ファイル名: string; 利用者ID: string | null; 取込種別: string };

/** 商品タグ更新の取込履歴の件数 */
export function 商品タグ更新の取込履歴件数(): number {
  return Number(query(`select count(*) as n from dtb_csv_import_history where csv_import_type_id = ${PRODUCT_TAG_IMPORT}`)[0].n);
}

/** ファイル名が一致する、商品タグ更新の取込履歴（履歴IDの順） */
export function ファイル名の取込履歴(ファイル名: string): 取込履歴[] {
  return query(`select h.id as "履歴ID", h.file_name as "ファイル名", h.member_id as "利用者ID", t.name as "取込種別"
    from dtb_csv_import_history h join mtb_csv_import_type t on t.id = h.csv_import_type_id
    where h.csv_import_type_id = ${PRODUCT_TAG_IMPORT} and h.file_name = $1 order by h.id`, [ファイル名])
    .map((r) => ({ 履歴ID: r.履歴ID ?? "", ファイル名: r.ファイル名 ?? "", 利用者ID: r.利用者ID, 取込種別: r.取込種別 ?? "" }));
}
