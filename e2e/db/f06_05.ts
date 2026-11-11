/** F06-05 マイページのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 会員の保有ポイント（会員の選手情報が無ければ null） */
export function 保有ポイント(会員ID: string): number | null {
  const r = query("select point from dtb_player where customer_id = $1::int and deleted_at is null order by id limit 1", [会員ID])[0];
  return r ? Number(r.point) : null;
}

/** 会員のポイント履歴を、全項目つきで ID の順に並べた文字列の一覧（変わっていないことの確認用） */
export function ポイント履歴の行(会員ID: string): string[] {
  return query("select row_to_json(h)::text as v from dtb_point_history h where h.customer_id = $1::int order by h.id", [会員ID]).map((r) => r.v ?? "");
}
