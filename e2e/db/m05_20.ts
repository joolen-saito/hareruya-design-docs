/** M05-20 出荷指示リスト編集のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { count } from "../lib/db";

/** 出荷指示リストIDの出荷指示リストが登録されている件数 */
export function 出荷指示リストの件数(出荷指示リストID: string): number {
  return count(`select 1 from dtb_shipping_standby where id = $1`, [出荷指示リストID]);
}
