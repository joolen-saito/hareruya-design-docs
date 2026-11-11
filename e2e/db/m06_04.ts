/** M06-04 買取ステータス変更のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 日時は「1970年からの秒」（null は未設定） */
export type 店頭買取の状態 = {
  ステータス: string; 買取成立日: number | null; 買取キャンセル日: number | null; 入庫日時: number | null; 更新日時: number | null;
  担当者: string | null; 買取成立日の日付: string | null;
};

const sec = (v: string | null) => (v === null ? null : Number(v));

/** 店頭買取受注（店頭買取受注ID）のステータス・ステータスに紐づく日時・更新日時・担当者 */
export function 店頭買取の状態(受注ID: string): 店頭買取の状態 {
  const rows = query(
    `select s.name as status, extract(epoch from o.complete_date)::text as complete, extract(epoch from o.cancel_date)::text as cancel,
            extract(epoch from o.restocked_date)::text as restocked, extract(epoch from o.update_date)::text as updated, m.name as member,
            to_char(o.complete_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD') as complete_day
       from dtb_otc_buy_order o left join mtb_otc_buy_order_status s on s.id = o.otc_buy_order_status_id
       left join dtb_member m on m.id = o.member_id
      where o.id = $1`, [受注ID]);
  if (rows.length !== 1) throw new Error(`店頭買取受注ID ${受注ID} の買取が ${rows.length} 件`);
  const r = rows[0];
  return {
    ステータス: r.status ?? "", 買取成立日: sec(r.complete), 買取キャンセル日: sec(r.cancel), 入庫日時: sec(r.restocked), 更新日時: sec(r.updated),
    担当者: r.member, 買取成立日の日付: r.complete_day,
  };
}

export type ステータス変更履歴 = { ステータス: string; 変更者: string | null; 変更日時: number };

/** 店頭買取受注のステータス変更履歴（変更日時の古い順） */
export function ステータス変更履歴(受注ID: string): ステータス変更履歴[] {
  return query(
    `select s.name as status, m.name as member, extract(epoch from h.create_date)::text as created
       from dtb_otc_buy_order_status_history h left join mtb_otc_buy_order_status s on s.id = h.otc_buy_order_status_id
       left join dtb_member m on m.id = h.member_id
      where h.otc_buy_order_id = $1 order by h.create_date, h.id`, [受注ID]).map((r) => ({
    ステータス: r.status ?? "", 変更者: r.member, 変更日時: Number(r.created),
  }));
}

export type 集計の行 = { 店舗ID: string; 部門ID: string; 買取金額: number; 販売金額: number };

/** 買取店舗（店舗ID）の、買取成立日（日本時間の日。YYYY-MM-DD）の買取集計データ。店舗ID・部門IDの順 */
export function 買取集計(日: string, 店舗ID: string[]): 集計の行[] {
  return query(
    `select s.base_info_id as shop, s.section_id as section, s.buy_price as buy, s.sell_price as sell
       from dtb_otc_buy_order_summary s
      where (s.summary_date at time zone 'Asia/Tokyo')::date = $1::date and s.base_info_id = any (string_to_array($2, ',')::int[])
      order by s.base_info_id, s.section_id`, [日, 店舗ID.join(",")]).map((r) => ({
    店舗ID: r.shop ?? "", 部門ID: r.section ?? "", 買取金額: Number(r.buy), 販売金額: Number(r.sell),
  }));
}

/** 店頭買取受注の、買取成立日・買取キャンセル日・入庫日時（日本時間の日付 YYYY-MM-DD。空なら null）と、買取成立日の日時 */
export function 買取の日付(受注ID: string): { 成立日: string | null; キャンセル日: string | null; 入庫日: string | null; 成立日時: string | null } {
  const r = query(
    `select to_char(complete_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD') as c, to_char(cancel_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD') as x,
            to_char(restocked_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD') as r, to_char(complete_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as ct
       from dtb_otc_buy_order where id = $1::int`, [受注ID]);
  if (r.length !== 1) throw new Error(`店頭買取受注ID ${受注ID} の買取が ${r.length} 件`);
  return { 成立日: r[0].c, キャンセル日: r[0].x, 入庫日: r[0].r, 成立日時: r[0].ct };
}
