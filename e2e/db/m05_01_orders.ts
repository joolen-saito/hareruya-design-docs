/**
 * M05-01 受注一覧の操作（削除・スタック用紙印刷）の結果の照会（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 実行区分が「ブラウザ+DB確認」のケースと、そのケースのシードでだけ使う。
 */
import { query } from "../lib/db";

export type 受注の状態 = {
  件数: number;
  対応状況: string | null;
  ブラウザ印刷フラグ: string | null;
  注文確定日: string | null;
  担当者: string | null;
  削除日時: string | null;
};

/** 受注IDの受注（論理削除された受注も含めて読む）。無ければ件数0 */
export function 受注の状態(受注ID: string): 受注の状態 {
  const rows = query(
    `select s.name as 対応状況, o.browser_print_flg::text as ブラウザ印刷フラグ, o.confirm_date::text as 注文確定日,
            m.name as 担当者, o.deleted_at::text as 削除日時
       from dtb_order o
       left join mtb_order_status s on s.id = o.order_status_id
       left join dtb_member m on m.id = o.operator_id
      where o.id = $1::int`, [受注ID]);
  const r = rows[0];
  return {
    件数: rows.length,
    対応状況: r?.対応状況 ?? null,
    ブラウザ印刷フラグ: r?.ブラウザ印刷フラグ ?? null,
    注文確定日: r?.注文確定日 ?? null,
    担当者: r?.担当者 ?? null,
    削除日時: r?.削除日時 ?? null,
  };
}
