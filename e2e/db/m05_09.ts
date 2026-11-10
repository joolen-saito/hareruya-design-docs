/**
 * M05-09 納品書印刷（日本語）の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足しは lib/db_write.ts を通し、持ち主（試験会員のメールアドレス）を確かめてから書く。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

/** 注文番号と試験会員のメールアドレスから受注ID（1件のはず） */
export function 受注IDの(注文番号: string, メール: string): string {
  const r = query(
    `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where o.order_number = $1 and c.email = $2 order by o.id desc`,
    [注文番号, メール]);
  if (r.length !== 1) throw new Error(`注文番号 ${注文番号}・会員 ${メール} の受注が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 受注の配送先ID（昇順） */
export function 受注の配送先ID(受注ID: string): string[] {
  return query(`select s.id from dtb_shipping s where s.order_id = $1 order by s.id`, [受注ID]).map((r) => String(r.id));
}

/** 受注の配送先の配送方法の名前（配送先ごと） */
export function 受注の配送方法(受注ID: string): string[] {
  return query(`select coalesce(d.name, '') as name from dtb_shipping s left join dtb_delivery d on d.id = s.delivery_id where s.order_id = $1 order by s.id`, [受注ID])
    .map((r) => String(r.name));
}

/** 配送方法（ID）の名前と国外配送か */
export function 配送方法(id: number): { 名前: string; 国外: boolean } | null {
  const r = query(`select name, is_abroad from dtb_delivery where id = $1`, [id])[0];
  return r ? { 名前: String(r.name), 国外: String(r.is_abroad) === "true" } : null;
}

/** 都道府県・国の名前があるか（マスタは共有なので書き換えない） */
export function 都道府県がある(名前: string): boolean { return query(`select id from mtb_pref where name = $1`, [名前]).length === 1; }
export function 国がある(名前: string): boolean { return query(`select id from mtb_country where name = $1`, [名前]).length === 1; }

/** 店舗ID 1（本店）の適格請求書発行事業者登録番号 */
export function 登録番号(): string {
  return String(query(`select coalesce(invoice_registration_number, '') as v from dtb_base_info where id = 1`)[0]?.v ?? "");
}

/** 会員（メールアドレス）のプレイヤーID（昇順） */
export function 会員のプレイヤーID(メール: string): string[] {
  return query(`select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where c.email = $1 order by p.id`, [メール]).map((r) => String(r.id));
}

/** 受注の明細のうち、商品コードの明細のID */
export function 明細IDの(受注ID: string, 商品コード: string): string[] {
  return query(
    `select oi.id from dtb_order_item oi join dtb_product_class pc on pc.id = oi.product_class_id where oi.order_id = $1 and pc.product_code = $2 order by oi.id`,
    [受注ID, 商品コード]).map((r) => String(r.id));
}

// ---- 持ち主の確かめ（試験会員のメールアドレスの受注・配送先・明細・プレイヤーだけ） ----
const 受注の持ち主 = (受注IDs: string[], メール: string): Owner => ({
  sql: `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where o.id = any($1::int[]) and c.email = $2`,
  params: [`{${受注IDs.join(",")}}`, メール],
});
const 配送先の持ち主 = (配送先IDs: string[], メール: string): Owner => ({
  sql: `select s.id from dtb_shipping s join dtb_order o on o.id = s.order_id join dtb_customer c on c.id = o.customer_id where s.id = any($1::int[]) and c.email = $2`,
  params: [`{${配送先IDs.join(",")}}`, メール],
});
const 明細の持ち主 = (明細IDs: string[], メール: string): Owner => ({
  sql: `select oi.id from dtb_order_item oi join dtb_order o on o.id = oi.order_id join dtb_customer c on c.id = o.customer_id where oi.id = any($1::int[]) and c.email = $2`,
  params: [`{${明細IDs.join(",")}}`, メール],
});
const プレイヤーの持ち主 = (プレイヤーIDs: string[], メール: string): Owner => ({
  sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where p.id = any($1::int[]) and c.email = $2`,
  params: [`{${プレイヤーIDs.join(",")}}`, メール],
});

/** 受注日時を指定の日時（日本時間）にする（画面では注文した日時になる） */
export function 受注日時を書き足す(what: string, 受注IDs: string[], メール: string, 日時: string): void {
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: 受注IDs, set: { order_date: `${日時}+09:00` }, owner: 受注の持ち主(受注IDs, メール) });
}

/** 受注の対応状況を名前の状態にする（出荷指示リストの生成で「出荷指示」に変わったものを戻す） */
export function 受注の対応状況を書き足す(what: string, 受注IDs: string[], メール: string, 名前: string): void {
  const r = query(`select id from mtb_order_status where name = $1`, [名前]);
  if (r.length !== 1) throw new Error(`${what}: 対応状況「${名前}」がマスタに無い`);
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: 受注IDs, set: { order_status_id: Number(r[0].id) }, owner: 受注の持ち主(受注IDs, メール) });
}

/** 注文者の都道府県を未設定にする（画面では都道府県は必須） */
export function 注文者の都道府県を空にする(what: string, 受注ID: string, メール: string): void {
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID], set: { pref_id: null }, owner: 受注の持ち主([受注ID], メール) });
}

/** 配送先の都道府県・国を未設定にする（画面ではどちらも必須） */
export function 配送先の項目を空にする(what: string, 配送先IDs: string[], メール: string, 項目: "都道府県" | "国"): void {
  const col = 項目 === "都道府県" ? "pref_id" : "country_id";
  updateOwnRows(what, { table: "dtb_shipping", key: "id", ids: 配送先IDs, set: { [col]: null }, owner: 配送先の持ち主(配送先IDs, メール) });
}

/** 明細の商品規格の紐付けを外す（画面では商品規格を持たない明細を作れない） */
export function 明細の商品規格を外す(what: string, 明細IDs: string[], メール: string): void {
  updateOwnRows(what, { table: "dtb_order_item", key: "id", ids: 明細IDs, set: { product_class_id: null }, owner: 明細の持ち主(明細IDs, メール) });
}

/** プレイヤーのスマレジ会員IDを書き足す（スマレジ側が振る値で、画面に入力欄が無い） */
export function プレイヤーのスマレジIDを書き足す(what: string, プレイヤーIDs: string[], メール: string, 値: string): void {
  updateOwnRows(what, { table: "dtb_player", key: "id", ids: プレイヤーIDs, set: { smaregi_id: 値 }, owner: プレイヤーの持ち主(プレイヤーIDs, メール) });
}

/** プレイヤーを会員から外す（会員登録で会員とプレイヤーが同時に作られ、画面では外せない） */
export function プレイヤーを会員から外す(what: string, プレイヤーIDs: string[], メール: string): void {
  updateOwnRows(what, { table: "dtb_player", key: "id", ids: プレイヤーIDs, set: { customer_id: null }, owner: プレイヤーの持ち主(プレイヤーIDs, メール) });
}

/** 出荷指示リスト（ID）が登録されているか */
export function 出荷指示リストがある(id: string): boolean {
  return query(`select id from dtb_shipping_standby where id = $1`, [id]).length > 0;
}
