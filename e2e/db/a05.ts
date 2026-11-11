/**
 * A05-01・A05-02・A05-03（注文印刷・店頭注文番号取得の API）の DB の参照と、E2E が作った行への書き足し
 * （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通し、持ち主（試験会員のメールアドレス・E2E が決まった名前で作った店舗）を確かめてから書く。
 */
import { query } from "../lib/db";
import { deleteOwnRows, Owner, updateOwnRows } from "../lib/db_write";

const 受注の持ち主 = (受注IDs: string[], メール: string): Owner => ({
  sql: `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where o.id = any($1::int[]) and c.email = $2`,
  params: [`{${受注IDs.join(",")}}`, メール],
});

/** 店舗IDの店舗があるか */
export function 店舗がある(店舗ID: string): boolean {
  return Number(query(`select count(*)::text as n from dtb_base_info where id = $1::bigint`, [店舗ID])[0]?.n ?? "0") > 0;
}

/** 店舗IDの店名（無ければ空） */
export function 店舗の店名(店舗ID: string): string {
  return String(query(`select shop_name from dtb_base_info where id = $1::int`, [店舗ID])[0]?.shop_name ?? "");
}

/** 対応状況の名前の番号（無ければ空） */
export function 対応状況の番号(名前: string): string {
  return String(query(`select id::text as id from mtb_order_status where name = $1`, [名前])[0]?.id ?? "");
}

export type 印刷待ちの定め = {
  /** 受注の店舗（既定は今のまま） */
  店舗ID?: string;
  /** 対応状況の名前（既定は「注文受領」） */
  対応状況?: string;
  /** 補助情報のブラウザ印刷フラグ */
  ブラウザ印刷: boolean;
  /** 金額・税・ポイント（008 の「再計算しない」の確かめ） */
  金額?: { 支払合計: number; 税: number; 付与ポイント: number };
};

/**
 * 受注を「印刷待ち」の状態にする（画面で指定できない値だけ。E2E の受注の行だけ）:
 * 対応状況・ブラウザ印刷フラグ・注文確定日を未設定・店舗・金額。
 */
export function 受注を印刷待ちにする(what: string, 受注ID: string, メール: string, d: 印刷待ちの定め): void {
  const 状況 = 対応状況の番号(d.対応状況 ?? "注文受領");
  if (!状況) throw new Error(`${what}: 対応状況「${d.対応状況 ?? "注文受領"}」が開発環境のマスタに無い`);
  const set: Record<string, string | number | boolean | null> = { order_status_id: Number(状況), browser_print_flg: d.ブラウザ印刷, confirm_date: null };
  if (d.店舗ID) set.base_info_id = Number(d.店舗ID);
  if (d.金額) { set.payment_total = d.金額.支払合計; set.tax = d.金額.税; set.add_point = d.金額.付与ポイント; }
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID], set, owner: 受注の持ち主([受注ID], メール) });
}

export type 印刷の状態 = {
  対応状況: string; ブラウザ印刷: boolean; 注文確定日: string; 店舗ID: string;
  支払合計: string; 税: string; 付与ポイント: string;
};

/** 受注の印刷に関わる状態（注文確定日は日本時間の「YYYY-MM-DD HH24:MI:SS」、未設定なら空） */
export function 受注の印刷の状態(受注ID: string): 印刷の状態 {
  const r = query(
    `select coalesce(s.name, '') as st, o.browser_print_flg::text as bp,
            coalesce(to_char(o.confirm_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS'), '') as cd,
            o.base_info_id::text as b, o.payment_total::text as pt, o.tax::text as tx, o.add_point::text as ap
       from dtb_order o left join mtb_order_status s on s.id = o.order_status_id where o.id = $1::int`, [受注ID])[0];
  if (!r) throw new Error(`受注ID ${受注ID} の受注が無い`);
  return {
    対応状況: r.st ?? "", ブラウザ印刷: r.bp === "true", 注文確定日: r.cd ?? "", 店舗ID: r.b ?? "",
    支払合計: r.pt ?? "", 税: r.tx ?? "", 付与ポイント: r.ap ?? "",
  };
}

/** 受注IDの受注があるか（未登録の 999999 の確かめ） */
export function 受注がある(受注ID: string): boolean {
  return Number(query(`select count(*)::text as n from dtb_order where id = $1::int`, [受注ID])[0]?.n ?? "0") > 0;
}

/** 商品規格の、店舗・在庫区分（EC-CUBE）の在庫数（無ければ null） */
export function 本店のEC在庫数(商品コード: string): number | null {
  const r = query(
    `select ps.stock::text as s from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and ps.base_info_id = 1 and ps.stock_location_id = 1 order by ps.id`, [商品コード]);
  return r.length === 1 && r[0].s !== null ? Number(r[0].s) : null;
}

/** 店舗の店頭注文番号札（登録の順） */
export function 店舗の番号札(店舗ID: string): { id: string; 札: string }[] {
  return query(`select id::text as id, waiting_tag as t from dtb_waiting_tag where base_info_id = $1::int order by id`, [店舗ID])
    .map((r) => ({ id: r.id ?? "", 札: r.t ?? "" }));
}

/** 店舗の店頭注文番号（受注の番号札）の件数 */
export function 店舗の店頭注文番号の数(店舗ID: string): number {
  return Number(query(`select count(*)::text as n from dtb_waiting_number where base_info_id = $1::int`, [店舗ID])[0]?.n ?? "0");
}

/** 店舗の受注の件数 */
export function 店舗の受注の数(店舗ID: string): number {
  return Number(query(`select count(*)::text as n from dtb_order where base_info_id = $1::int`, [店舗ID])[0]?.n ?? "0");
}

/**
 * E2E が決まった名前で1度だけ作った試験用の店舗（店名・会社名で持ち主を確かめる）の店頭注文番号札を消す。
 * 前の実行で同じ店舗に登録した番号札を、ケースの開始前に0件へ戻す（その店舗はこの E2E だけが使う）。
 */
export function 試験店舗の番号札を消す(what: string, 店舗ID: string, 店名: string, 会社名: string): number {
  const ids = 店舗の番号札(店舗ID).map((x) => x.id);
  if (ids.length === 0) return 0;
  deleteOwnRows(what, {
    table: "dtb_waiting_tag", key: "id", ids,
    owner: { sql: `select t.id from dtb_waiting_tag t join dtb_base_info b on b.id = t.base_info_id where b.id = $1::int and b.shop_name = $2 and b.company_name = $3`, params: [店舗ID, 店名, 会社名] },
  });
  return ids.length;
}
