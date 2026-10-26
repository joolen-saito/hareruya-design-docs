/** M03-40 棚番号更新CSV登録のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { count } from "../lib/db";

/** 棚番号更新CSVの取込履歴の件数（CSV種別の名称「棚番号更新」で引く） */
export function 棚番号更新CSVの取込履歴件数(): number {
  return count(`select h.id from dtb_csv_import_history h
    join mtb_csv_import_type t on t.id = h.csv_import_type_id
    where t.name = $1`, ["棚番号更新"]);
}
