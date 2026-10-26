/** 商品とカード商品CSVの取込履歴のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 商品データの状態 = { 商品件数: number; 最終更新日時: string | null; カード商品CSV取込履歴件数: number };

/** 商品の件数・商品の最終更新日時（全商品の更新日時の最大）・カード商品CSVの取込履歴の件数 */
export function 商品データの状態(): 商品データの状態 {
  const r = query(`select (select count(*) from dtb_product) as "商品件数",
      (select max(update_date) from dtb_product) as "最終更新日時",
      (select count(*) from dtb_csv_import_history h join mtb_csv_import_type t on t.id = h.csv_import_type_id
        where t.name = 'カード商品登録') as "取込履歴件数"`)[0];
  return { 商品件数: Number(r.商品件数), 最終更新日時: r.最終更新日時, カード商品CSV取込履歴件数: Number(r.取込履歴件数) };
}
