/**
 * M05-11 受注情報編集の続き（-o）の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。呼ぶ側には業務の言葉の関数名で見せる。
 * 書き足すのは、画面で作った E2E の行（受注・会員・商品規格）の、画面で作れない状態（過去の日時・週間販売数・画面で入らない値）だけ。
 */
import { query } from "../lib/db";
import { insertOwnRows, Owner, updateOwnRows } from "../lib/db_write";

/** 本店（店舗A）の受注で、注文番号・注文者のメールアドレスの両方が当たるもの（E2E の会員の受注だけ） */
function 受注の持ち主(注文番号: string, メール: string): Owner {
  return { sql: `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where o.order_number = $1 and o.base_info_id = 1 and c.email = $2`, params: [注文番号, メール] };
}
/** 商品コード（実行の印つき）の商品規格 */
function 規格の持ち主(商品コード: string): Owner {
  return { sql: `select pc.id from dtb_product_class pc where pc.product_code = $1`, params: [商品コード] };
}
/** 会員（メールアドレス。実行の印つき） */
function 会員の持ち主(メール: string): Owner {
  return { sql: `select c.id from dtb_customer c where c.email = $1`, params: [メール] };
}

function 受注ID(注文番号: string, メール: string): string {
  const r = query(`select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where o.order_number = $1 and o.base_info_id = 1 and c.email = $2`, [注文番号, メール]);
  if (r.length !== 1) throw new Error(`注文番号「${注文番号}」・会員「${メール}」の受注が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

// ---- 書き足し（E2E の行だけ） ----

/** 受注のキャンセル日を指定の日時にする（画面では、キャンセルの操作をした日時になる） */
export function 受注のキャンセル日を書き足す(what: string, 注文番号: string, メール: string, 日時: string): void {
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID(注文番号, メール)], set: { cancel_date: 日時 }, owner: 受注の持ち主(注文番号, メール) });
}

/** 受注日を、いまの受注日から日数ぶん前にずらす（画面では、注文を確定した日時になる） */
export function 受注日を前へずらす(what: string, 注文番号: string, メール: string, 日数: number): string {
  const id = 受注ID(注文番号, メール);
  const now = query(`select to_char(o.order_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as d from dtb_order o where o.id = $1`, [id])[0].d;
  if (!now) throw new Error(`${what}: 受注日が入っていない`);
  const moved = new Date(new Date(now).getTime() - 日数 * 86_400_000).toISOString();
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [id], set: { order_date: moved }, owner: 受注の持ち主(注文番号, メール) });
  return moved;
}

const 週の欄 = ["sales_quantity_01", "sales_quantity_02", "sales_quantity_03", "sales_quantity_04", "sales_quantity_05", "sales_quantity_06", "sales_quantity_07", "sales_quantity_08"] as const;

/** 商品規格別の週間販売数（本店・EC-CUBE の販売）の各比較欄を同じ値にする。行が無ければ足す */
export function 週間販売数を書き足す(what: string, 商品コード: string, 値: number): void {
  const pc = query(`select pc.id from dtb_product_class pc where pc.product_code = $1`, [商品コード]);
  if (pc.length !== 1) throw new Error(`${what}: 商品コード「${商品コード}」の商品規格が ${pc.length} 件（1件のはず）`);
  const pcId = String(pc[0].id);
  const set = Object.fromEntries(週の欄.map((c) => [c, 値]));
  const rows = query(`select sq.id from dtb_sales_quantity sq where sq.product_class_id = $1 and sq.base_info_id = 1 and sq.sales_location = 1`, [pcId]);
  if (rows.length === 0) {
    insertOwnRows(what, {
      table: "dtb_sales_quantity", parentColumn: "product_class_id",
      rows: [{ product_class_id: pcId, base_info_id: 1, sales_location: 1, ...set, update_date: new Date().toISOString() }],
      owner: 規格の持ち主(商品コード),
    });
    return;
  }
  updateOwnRows(what, {
    table: "dtb_sales_quantity", key: "id", ids: rows.map((r) => String(r.id)), set,
    owner: { sql: `select sq.id from dtb_sales_quantity sq join dtb_product_class pc on pc.id = sq.product_class_id where pc.product_code = $1`, params: [商品コード] },
  });
}

/** 会員の最終購入日時を指定の日時にする（画面では、購入した日時になる） */
export function 会員の最終購入日時を書き足す(what: string, メール: string, 日時: string | null): void {
  const r = query(`select c.id from dtb_customer c where c.email = $1`, [メール]);
  if (r.length !== 1) throw new Error(`${what}: 会員「${メール}」が ${r.length} 人（1人のはず）`);
  updateOwnRows(what, { table: "dtb_customer", key: "id", ids: [String(r[0].id)], set: { last_buy_date: 日時 }, owner: 会員の持ち主(メール) });
}

/** 会員の累計注文金額を指定の額にする（画面では、購入の金額の合計になる） */
export function 会員の累計注文金額を書き足す(what: string, メール: string, 金額: number): void {
  const r = query(`select c.id from dtb_customer c where c.email = $1`, [メール]);
  if (r.length !== 1) throw new Error(`${what}: 会員「${メール}」が ${r.length} 人（1人のはず）`);
  updateOwnRows(what, { table: "dtb_customer", key: "id", ids: [String(r[0].id)], set: { buy_total: 金額 }, owner: 会員の持ち主(メール) });
}

/** 受注のポイントの付帯情報（発生ポイント・使用ポイント・ポイント付与率）と送り状No.・ポイント連携エラーを書き換える。null で未設定にする */
export function 受注のポイント付帯情報を書き足す(what: string, 注文番号: string, メール: string, v: { 発生?: number | null; 使用?: number | null; 付与率?: number | null }): void {
  const set: Record<string, number | null> = {};
  if (v.発生 !== undefined) set.gained_points = v.発生;
  if (v.使用 !== undefined) set.spended_points = v.使用;
  if (v.付与率 !== undefined) set.point_percentage = v.付与率;
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID(注文番号, メール)], set, owner: 受注の持ち主(注文番号, メール) });
}

// ---- 確認（参照だけ） ----

/** 受注のキャンセル日（日本時間の日付。無ければ空） */
export function 受注のキャンセル日(注文番号: string, メール: string): string {
  const r = query(`select coalesce(to_char(o.cancel_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD'), '') as d from dtb_order o where o.id = $1`, [受注ID(注文番号, メール)]);
  return r[0].d ?? "";
}

/** 商品規格別の週間販売数（本店・EC-CUBE の販売）。当日・翌日・3日以内・7日以内・28日以内・90日以内・180日以内・365日以内の順 */
export function 週間販売数(商品コード: string): number[] {
  const r = query(
    `select ${週の欄.map((c) => `sq.${c}::text as ${c}`).join(", ")} from dtb_sales_quantity sq join dtb_product_class pc on pc.id = sq.product_class_id
      where pc.product_code = $1 and sq.base_info_id = 1 and sq.sales_location = 1`, [商品コード]);
  if (r.length !== 1) return [];
  return 週の欄.map((c) => Number(r[0][c]));
}

/** 受注に紐づくポイント履歴の増減量（古い順） */
export function 受注のポイント履歴(注文番号: string, メール: string): number[] {
  return query(`select ph.point_change::text as v from dtb_point_history ph where ph.order_id = $1 order by ph.id`, [受注ID(注文番号, メール)]).map((r) => Number(r.v));
}

/** 商品コードの在庫変動履歴のうち、変更前・変更後・増減数が指定のものの件数 */
export function 在庫変動履歴の件数(商品コード: string, v: { 変更前: number; 変更後: number; 増減数: number }): number {
  return Number(query(
    `select count(*)::text as n from dtb_stock_history h join dtb_product_stock s on s.id = h.product_stock_id join dtb_product_class pc on pc.id = s.product_class_id
      where pc.product_code = $1 and h.old_stock = $2 and h.stock = $3 and h.stock_change_quantity = $4`,
    [商品コード, String(v.変更前), String(v.変更後), String(v.増減数)])[0].n);
}

/** 会員の最終購入日時（日本時間 YYYY-MM-DD HH:MI:SS。無ければ空）と累計注文金額 */
export function 会員の購入の記録(メール: string): { 最終購入日時: string; 累計注文金額: number } {
  const r = query(`select coalesce(to_char(c.last_buy_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS'), '') as d, coalesce(c.buy_total, 0)::text as t from dtb_customer c where c.email = $1`, [メール]);
  if (r.length !== 1) throw new Error(`会員「${メール}」が ${r.length} 人（1人のはず）`);
  return { 最終購入日時: r[0].d ?? "", 累計注文金額: Number(r[0].t) };
}

/** 会員の連絡先（姓・名・郵便番号・都道府県・住所1・住所2・メール・電話） */
export function 会員の連絡先(メール: string): Record<string, string> {
  const r = query(
    `select coalesce(c.name01, '') as "姓", coalesce(c.name02, '') as "名", coalesce(c.postal_code, '') as "郵便番号", coalesce(p.name, '') as "都道府県",
            coalesce(c.addr01, '') as "住所1", coalesce(c.addr02, '') as "住所2", c.email as "メール",
            concat_ws('', c.tel01, c.tel02, c.tel03) as "電話"
       from dtb_customer c left join mtb_pref p on p.id = c.pref_id where c.email = $1`, [メール]);
  if (r.length !== 1) throw new Error(`会員「${メール}」が ${r.length} 人（1人のはず）`);
  return r[0] as Record<string, string>;
}

/** 配送方法（名前）の、表示するお届け時間（並び順） */
export function 配送方法のお届け時間(名前: string): string[] {
  return query(
    `select t.delivery_time as v from dtb_delivery_time t join dtb_delivery d on d.id = t.delivery_id
      where d.name = $1 and t.visible = true order by t.sort_no, t.id`, [名前]).map((r) => String(r.v));
}

/** 受注IDの受注があるか */
export function 受注IDがあるか(受注ID: string): boolean {
  return query(`select 1 as x from dtb_order o where o.id = $1`, [受注ID]).length > 0;
}

/** 受注の日付の欄（ピック中・入金日・出荷指示日・出荷日・キャンセル日・店頭予約日） */
export const 受注の日付の欄 = { ピック中: "confirm_date", 入金日: "payment_date", 出荷指示日: "commit_date", 出荷日: "shipping_date", キャンセル日: "cancel_date", 店頭予約日: "otc_rsv_date" } as const;
export type 受注の日付 = keyof typeof 受注の日付の欄;

/** 受注の日付を書き足す（画面では、その状態へ変えた日時になる） */
export function 受注の日付を書き足す(what: string, 注文番号: string, メール: string, v: Partial<Record<受注の日付, string>>): void {
  const set = Object.fromEntries(Object.entries(v).map(([k, d]) => [受注の日付の欄[k as 受注の日付], d as string]));
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID(注文番号, メール)], set, owner: 受注の持ち主(注文番号, メール) });
}

/** 受注の日付（日本時間の日付。無ければ空） */
export function 受注の日付(注文番号: string, メール: string): Record<受注の日付, string> {
  const cols = Object.entries(受注の日付の欄).map(([k, c]) => `coalesce(to_char(o.${c} at time zone 'Asia/Tokyo', 'YYYY-MM-DD'), '') as "${k}"`).join(", ");
  return query(`select ${cols} from dtb_order o where o.id = $1`, [受注ID(注文番号, メール)])[0] as Record<受注の日付, string>;
}

/** 受注の現在のステータスの名前 */
export function 受注のステータス(注文番号: string, メール: string): string {
  return String(query(`select s.name from dtb_order o join mtb_order_status s on s.id = o.order_status_id where o.id = $1`, [受注ID(注文番号, メール)])[0].name);
}
