/**
 * M05-07 送り状CSV出力・M05-24 出荷実績入力用CSV出力の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足しは lib/db_write.ts を通し、持ち主（試験会員のメールアドレス）を確かめてから書く。
 */
import { query } from "../lib/db";
import { insertOwnRows, Owner, updateOwnRows } from "../lib/db_write";

const 受注の持ち主 = (受注IDs: string[], メール: string): Owner => ({
  sql: `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where o.id = any($1::int[]) and c.email = $2`,
  params: [`{${受注IDs.join(",")}}`, メール],
});
const 会員の持ち主 = (メール: string): Owner => ({ sql: `select c.id from dtb_customer c where c.email = $1`, params: [メール] });

export type 受注の日時 = { 注文日?: string | null; 注文確定日?: string | null; 入金日?: string | null; 出荷指示日?: string | null; 出荷日?: string | null; 更新日時?: string | null };
const 日時の列: Record<keyof 受注の日時, string> = {
  注文日: "order_date", 注文確定日: "confirm_date", 入金日: "payment_date", 出荷指示日: "commit_date", 出荷日: "shipping_date", 更新日時: "update_date",
};

/** 受注の日時の項目を指定の日時（日本時間。null なら未設定）にする（画面では指定できない） */
export function 受注の日時を書き足す(what: string, 受注ID: string, メール: string, v: 受注の日時): void {
  const set: Record<string, string | null> = {};
  for (const [k, col] of Object.entries(日時の列) as [keyof 受注の日時, string][]) {
    if (!(k in v)) continue;
    const x = v[k];
    set[col] = x === null || x === undefined ? null : `${x}+09:00`;
  }
  if (Object.keys(set).length === 0) return;
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID], set, owner: 受注の持ち主([受注ID], メール) });
}

/** 受注の金額と状態（CSV の値と見比べる） */
export function 受注の値(受注ID: string): {
  注文金額合計: string; 商品金額合計: string; 送料: string; 手数料: string; 対応状況: string;
  注文日: string; 注文確定日: string; 入金日: string; 出荷指示日: string; 出荷日: string; 更新日時: string;
} {
  const f = (c: string) => `coalesce(to_char(o.${c} at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI:SS'), '') as ${c}`;
  const r = query(
    `select o.total::text as total, o.subtotal::text as subtotal, o.delivery_fee_total::text as fee, o.charge::text as charge, coalesce(s.name, '') as st,
            ${f("order_date")}, ${f("confirm_date")}, ${f("payment_date")}, ${f("commit_date")}, ${f("shipping_date")}, ${f("update_date")}
       from dtb_order o left join mtb_order_status s on s.id = o.order_status_id where o.id = $1::int`, [受注ID])[0];
  if (!r) throw new Error(`受注ID ${受注ID} の受注が無い`);
  return {
    注文金額合計: r.total ?? "", 商品金額合計: r.subtotal ?? "", 送料: r.fee ?? "", 手数料: r.charge ?? "", 対応状況: r.st ?? "",
    注文日: r.order_date ?? "", 注文確定日: r.confirm_date ?? "", 入金日: r.payment_date ?? "", 出荷指示日: r.commit_date ?? "", 出荷日: r.shipping_date ?? "", 更新日時: r.update_date ?? "",
  };
}

/** 注文番号の受注の件数（削除済みでないもの） */
export function 注文番号の受注の数(注文番号: string): number {
  return Number(query(`select count(*)::text as n from dtb_order where order_number = $1 and deleted_at is null`, [注文番号])[0]?.n ?? "0");
}

/** 注文者会社名の受注の件数（削除済みでないもの） */
export function 注文者会社の受注の数(会社名: string): number {
  return Number(query(`select count(*)::text as n from dtb_order where company_name = $1 and deleted_at is null`, [会社名])[0]?.n ?? "0");
}

/** 会員（メールアドレス）の会員ID */
export function 会員IDの(メール: string): string {
  const r = query(`select id from dtb_customer where email = $1 order by id`, [メール]);
  if (r.length !== 1) throw new Error(`メールアドレス ${メール} の会員が ${r.length} 人（1人のはず）`);
  return String(r[0].id);
}

/** 受注の明細のID（昇順） */
export function 受注の明細IDの一覧(受注ID: string): string[] {
  return query(`select id from dtb_order_item where order_id = $1::int order by id`, [受注ID]).map((r) => String(r.id));
}

/** 会員の性別・職業・誕生日・国・都道府県・住所3（出荷実績入力用CSVの注文者の項目と見比べる） */
export function 会員の値(会員ID: string): { 性別: string; 職業: string; 誕生日: string; 国: string; 都道府県: string; 住所3: string; メール: string } {
  const r = query(
    `select coalesce(c.sex_id::text, '') as sex, coalesce(c.job_id::text, '') as job,
            coalesce(to_char(c.birth at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI:SS'), '') as birth,
            coalesce(co.name, '') as country, coalesce(p.name, '') as pref, coalesce(c.addr03, '') as addr03, c.email as email
       from dtb_customer c left join mtb_country co on co.id = c.country_id left join mtb_pref p on p.id = c.pref_id where c.id = $1::int`, [会員ID])[0];
  if (!r) throw new Error(`会員ID ${会員ID} の会員が無い`);
  return { 性別: r.sex ?? "", 職業: r.job ?? "", 誕生日: r.birth ?? "", 国: r.country ?? "", 都道府県: r.pref ?? "", 住所3: r.addr03 ?? "", メール: r.email ?? "" };
}

/** 会員の性別・職業を未設定にする（会員登録の画面で選んだものを外す。フロントの会員登録は性別を必ず持たせる作りのことがある） */
export function 会員の性別と職業を外す(what: string, メール: string): void {
  updateOwnRows(what, { table: "dtb_customer", key: "id", ids: [会員IDの(メール)], set: { sex_id: null, job_id: null }, owner: 会員の持ち主(メール) });
}

/** 受注の配送（番号の小さい順）の姓 */
export function 受注の配送の姓(受注ID: string): { 配送先ID: string; 姓: string }[] {
  return query(`select id, coalesce(name01, '') as n from dtb_shipping where order_id = $1::int and deleted_at is null order by id`, [受注ID])
    .map((r) => ({ 配送先ID: String(r.id), 姓: r.n ?? "" }));
}

/**
 * 受注に2件目の配送を足す（1件目の配送の値を写し、姓だけ変える）。足した配送の番号を返す（正本の配送ID 4052400902 は指定せず、DB が振る番号を使う）。
 * 数量1の注文を画面で2件の配送に分けられないため（F04-03 の 二件目の配送を足す と同じ作り）。
 */
export function 二件目の配送を足す(what: string, 受注ID: string, メール: string, 姓: string): string {
  const cols = ["order_id", "country_id", "pref_id", "delivery_id", "customer_id", "base_info_id", "name02", "kana01", "kana02",
    "postal_code", "addr01", "addr02", "tel01", "tel02", "tel03", "delivery_name", "sort_no"];
  const src = query(`select ${cols.map((c) => `${c}::text as ${c}`).join(", ")} from dtb_shipping where order_id = $1::int order by id limit 1`, [受注ID])[0];
  if (!src) throw new Error(`${what}: 受注 ${受注ID} に1件目の配送が無い`);
  const before = new Set(受注の配送の姓(受注ID).map((s) => s.配送先ID));
  const now = new Date().toISOString();
  const row: Record<string, string | number | null> = {};
  for (const c of cols) row[c] = src[c] ?? null;
  row.name01 = 姓;
  row.create_date = now;
  row.update_date = now;
  insertOwnRows(what, { table: "dtb_shipping", parentColumn: "order_id", rows: [row], owner: 受注の持ち主([受注ID], メール) });
  const added = 受注の配送の姓(受注ID).filter((s) => !before.has(s.配送先ID));
  if (added.length !== 1) throw new Error(`${what}: 足した2件目の配送を見つけられない（${added.length} 件）`);
  return added[0].配送先ID;
}

/** 商品コードの商品規格ID（1件のはず） */
export function 商品規格IDの(商品コード: string): string {
  const r = query(`select id from dtb_product_class where product_code = $1 order by id`, [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}
