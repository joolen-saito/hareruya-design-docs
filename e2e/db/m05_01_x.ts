/**
 * M05-01 受注情報検索 一覧の続き（-x）の照会（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

export type 購入実績 = { 購入回数: number; 購入金額: number; 初回購入日時: string | null; 最終購入日時: string | null };

/** 会員の購入実績（購入回数・購入金額・初回／最終購入日時） */
export function 会員の購入実績(会員ID: string): 購入実績 {
  const r = query(
    `select coalesce(c.buy_times, 0)::text as 回数, coalesce(c.buy_total, 0)::text as 金額,
            to_char(c.first_buy_date, 'YYYY-MM-DD HH24:MI:SS') as 初回, to_char(c.last_buy_date, 'YYYY-MM-DD HH24:MI:SS') as 最終
       from dtb_customer c where c.id = $1::int`, [会員ID])[0];
  if (!r) throw new Error(`会員ID ${会員ID} の会員が無い`);
  return { 購入回数: Number(r.回数), 購入金額: Number(r.金額), 初回購入日時: r.初回, 最終購入日時: r.最終 };
}

/** 会員の受注のうち、削除されておらず、キャンセル・購入処理中でないものの数（集計対象の受注） */
export function 会員の集計対象の受注数(会員ID: string): number {
  return Number(query(
    `select count(*)::text as n from dtb_order o
      where o.customer_id = $1::int and o.deleted_at is null and o.order_status_id not in (3, 8)`, [会員ID])[0]?.n ?? 0);
}

/** 注文番号の受注の対応状況の名前・出荷日・キャンセル日（いちばん新しい受注） */
export function 受注の状態(注文番号: string): { 受注ID: string; 対応状況: string; 出荷日: string | null; キャンセル日: string | null } {
  const r = query(
    `select o.id::text as 受注ID, s.name as 対応状況,
            to_char(o.shipping_date, 'YYYY-MM-DD HH24:MI:SS') as 出荷日, to_char(o.cancel_date, 'YYYY-MM-DD HH24:MI:SS') as キャンセル日
       from dtb_order o join mtb_order_status s on s.id = o.order_status_id
      where o.order_number = $1 order by o.id desc limit 1`, [注文番号])[0];
  if (!r) throw new Error(`注文番号 ${注文番号} の受注が無い`);
  return { 受注ID: r.受注ID ?? "", 対応状況: r.対応状況 ?? "", 出荷日: r.出荷日, キャンセル日: r.キャンセル日 };
}

/** 注文番号の受注の店舗ID（いちばん新しい受注） */
export function 受注の店舗ID(注文番号: string): string {
  return query(`select o.base_info_id::text as id from dtb_order o where o.order_number = $1 order by o.id desc limit 1`, [注文番号])[0]?.id ?? "";
}

/** 表示件数のマスタの名前（並び順） */
export function 表示件数のマスタ(): string[] {
  return query(`select m.name from mtb_page_max m order by m.sort_no`).map((r) => r.name ?? "");
}
