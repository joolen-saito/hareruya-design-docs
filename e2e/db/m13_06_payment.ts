/** M13-06 支払方法の表示順のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** イベント申込一覧の支払方法の選択肢になる3つ（クレジットカード決済・コンビニ決済・管理者追加）の、支払方法名と表示順。表示順の昇順 */
export function 支払方法の表示順(): { 支払方法: string; 表示順: number }[] {
  return query(`select payment_method as m, sort_no as s from dtb_payment where id in (5, 6, 7) order by sort_no asc, id asc`)
    .map((r) => ({ 支払方法: String(r.m), 表示順: Number(r.s) }));
}
