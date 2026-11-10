/** F04-02 共有の設定（配送方法・支払方法）のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 配送方法（名称）に紐付いている支払方法の名称（重複なし） */
export function 配送方法の支払方法名(配送方法: string): string[] {
  return [...new Set(query(
    `select pm.payment_method as n from dtb_payment_option po join dtb_delivery d on d.id = po.delivery_id join dtb_payment pm on pm.id = po.payment_id where d.name = $1`,
    [配送方法]).map((r) => r.n ?? ""))].sort();
}

/** 配送方法の ID（名称が一意でないときは null） */
export function 配送方法ID(名称: string): string | null {
  const r = query(`select id from dtb_delivery where name = $1 order by id`, [名称]);
  return r.length === 1 ? (r[0].id ?? null) : null;
}

export type 支払方法の設定 = { ID: string; 名称: string; 表示: boolean; 手数料: string; 下限: string; 上限: string };
/** 支払方法（名称）の設定。同じ名称が複数あれば全部 */
export function 支払方法の設定(名称: string): 支払方法の設定[] {
  return query(
    `select id, payment_method, visible, charge, coalesce(rule_min::text,'') as rmin, coalesce(rule_max::text,'') as rmax from dtb_payment where payment_method = $1 order by id`,
    [名称]).map((r) => ({ ID: r.id ?? "", 名称: r.payment_method ?? "", 表示: r.visible === "true", 手数料: r.charge ?? "", 下限: r.rmin ?? "", 上限: r.rmax ?? "" }));
}

/** 配送方法（ID）に紐付く支払方法のID（昇順・重複なし） */
export function 配送方法の支払方法ID(配送方法ID: string): string[] {
  return [...new Set(query(`select payment_id as p from dtb_payment_option where delivery_id = $1`, [配送方法ID]).map((r) => r.p ?? ""))].sort((a, b) => Number(a) - Number(b));
}

/** 配送方法の都道府県別送料を一括で比べるための要約（行数・最小・最大・合計） */
export function 配送方法の送料の要約(配送方法ID: string): string {
  const r = query(`select count(*) as n, coalesce(min(fee),0) as lo, coalesce(max(fee),0) as hi, coalesce(sum(fee),0) as s, coalesce(sum(pref_id * 31 + coalesce(size,0)),0) as k from dtb_delivery_fee where delivery_id = $1`, [配送方法ID])[0];
  return `${r.n}/${r.lo}/${r.hi}/${r.s}/${r.k}`;
}

/** 受注の内訳（受注情報編集画面で見る値の照合用）。受注ID指定 */
export function 受注の金額(受注ID: string): { 送料: string; 手数料: string; 合計: string; 支払方法: string } {
  const r = query(`select delivery_fee_total as d, charge as c, payment_total as t, coalesce(payment_method,'') as m from dtb_order where id = $1`, [受注ID])[0];
  return { 送料: r?.d ?? "", 手数料: r?.c ?? "", 合計: r?.t ?? "", 支払方法: r?.m ?? "" };
}

/** 受注に保存されている支払方法の名称 */
export function 受注の支払方法(受注ID: string): string {
  return query(`select coalesce(payment_method,'') as m from dtb_order where id = $1`, [受注ID])[0]?.m ?? "";
}

/** 会員の受注のうち、受注IDが最大（最新）のもの（購入処理中を除く） */
export function 会員の最新の受注ID(会員ID: string): string {
  return query(`select id from dtb_order where customer_id = $1 and order_status_id <> 8 order by id desc limit 1`, [会員ID])[0]?.id ?? "";
}
