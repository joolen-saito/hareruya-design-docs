/** M03-33 のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";
import { 取込種別 } from "./m03_32_high_price";

export type セール取込履歴 = { 履歴ID: string; ファイル名: string; 利用者ID: string | null; 種別番号: string };

/** セール用高額商品価格変更・高額商品価格変更のどちらの種別でも、ファイル名が一致する取込履歴（履歴IDの順） */
export function ファイル名の取込履歴(ファイル名: string): セール取込履歴[] {
  return query(`select h.id as "履歴ID", h.file_name as "ファイル名", h.member_id as "利用者ID", h.csv_import_type_id as "種別番号"
    from dtb_csv_import_history h where h.csv_import_type_id in ($2, $3) and h.file_name = $1 order by h.id`,
  [ファイル名, 取込種別.高額商品価格変更, 取込種別.セール用高額商品価格変更])
    .map((r) => ({ 履歴ID: r.履歴ID ?? "", ファイル名: r.ファイル名 ?? "", 利用者ID: r.利用者ID, 種別番号: r.種別番号 ?? "" }));
}
