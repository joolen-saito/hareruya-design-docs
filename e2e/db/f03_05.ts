/** F03-05 商品リコメンドのシードが使うDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 在庫編集の承認一覧で、いま振られている最大の番号（登録した行を見分ける目印） */
export function 承認一覧の最大番号(): number {
  return Number(query(`select coalesce(max(id), 0)::text as m from dtb_stock_approval_list`)[0]?.m ?? "0");
}
