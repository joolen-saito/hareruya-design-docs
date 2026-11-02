/** M05-27 店頭注文番号札管理のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 店舗（店舗ID）に登録されている店頭注文番号札（番号札IDの順） */
export function 店頭注文番号札の一覧(店舗ID: string): string[] {
  return query(`select waiting_tag as "札" from dtb_waiting_tag where base_info_id = $1 order by id`, [店舗ID]).map((r) => r.札 ?? "");
}

/** 店舗（店舗ID）で、番号札が値と一致するものの件数 */
export function 店頭注文番号札の件数(店舗ID: string, 札: string): number {
  return 店頭注文番号札の一覧(店舗ID).filter((t) => t === 札).length;
}
