/**
 * M04-21 在庫変更CSV登録の続き（-x）の DB 確認と、E2E が作った行への書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * - 照会は参照だけ（lib/db.ts）。
 * - 書き足すのは、画面で作った E2E の行（実行の印つきの商品コードの規格・在庫、実行の印つきのファイル名の取込の記録）だけ
 *   （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts の窓口を通す）。
 * 読み方:
 * - 在庫編集承認情報 = 在庫編集の承認の見出しと、その在庫編集承認一覧の行（承認対象「在庫変更CSV登録」）。ファイル名は取込の記録から引く。
 * - 入庫承認待ち在庫情報 = 在庫編集の承認の明細。
 * - 在庫変更履歴 = 在庫変更CSV登録履歴の行（取込の記録。ファイル名・保存先）。
 * - 在庫変動履歴 = 在庫の履歴。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number(v));
const LOC = `(case ps.stock_location_id when 1 then 'EC-CUBE' when 2 then 'スマレジ' else '' end)`;

// ---- 持ち主の確かめ（実行の印つきの値の行だけ） ----

const 自分の在庫 = {
  sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code like '%-' || $1`,
  params: [RUN_MARK],
};
const 自分の商品 = {
  sql: `select p.id from dtb_product p where exists (select 1 from dtb_product_class pc where pc.product_id = p.id and pc.product_code like '%-' || $1)`,
  params: [RUN_MARK],
};
const 自分の規格 = { sql: `select pc.id from dtb_product_class pc where pc.product_code like '%-' || $1`, params: [RUN_MARK] };
const 自分の取込の記録 = { sql: `select c.id from dtb_stock_edit_csv c where c.file_name like '%-' || $1 || '.csv'`, params: [RUN_MARK] };
const 自分の取込の承認 = { sql: `select c.stock_edit_id from dtb_stock_edit_csv c where c.file_name like '%-' || $1 || '.csv'`, params: [RUN_MARK] };

// ---- 店舗・所属・商品 ----

/** 店名（完全一致）の店舗ID。1件でなければ落とす（店舗は作らない） */
export function 店名の店舗ID(店名: string): string {
  const r = query(`select b.id from dtb_base_info b where b.shop_name = $1`, [店名]);
  if (r.length !== 1) throw new Error(`店名「${店名}」の店舗が ${r.length} 件（開発環境に1件ある前提。店舗は作らない）`);
  return String(r[0].id);
}

/** 所属の名前（完全一致）が所属のマスタにあるか（所属のマスタは足さない） */
export function 所属がある(名前: string): boolean {
  return query(`select d.id from mtb_department d where d.name = $1`, [名前]).length === 1;
}

/** 商品コードの規格の件数（「無い」「前の実行の残り」の見分け） */
export function 商品コードの規格の件数(商品コード: string): number {
  return Number(query(`select count(*) as n from dtb_product_class pc where pc.product_code = $1`, [商品コード])[0]?.n ?? 0);
}

/** 商品コードの規格の商品ID・商品規格ID（1件であること） */
export function 商品と規格(商品コード: string): { 商品ID: string; 商品規格ID: string } {
  const r = query(`select pc.product_id, pc.id from dtb_product_class pc where pc.product_code = $1`, [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の規格が ${r.length} 件（1件のはず）`);
  return { 商品ID: String(r[0].product_id), 商品規格ID: String(r[0].id) };
}

/** 商品IDの商品の規格のID（その商品の規格が1件であること） */
export function 商品のただ1つの規格(商品ID: string): string {
  const r = query(`select pc.id from dtb_product_class pc where pc.product_id = $1`, [商品ID]);
  if (r.length !== 1) throw new Error(`商品ID ${商品ID} の規格が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

export type 在庫 = { 在庫ID: string; 在庫数: number; 総原価: number };

/** 商品規格ID・店舗ID・在庫区分（1=EC-CUBE、2=スマレジ）の在庫（1件であること） */
export function 規格の在庫(商品規格ID: string, 店舗ID: string, 在庫区分番号 = 1): 在庫 {
  const r = query(
    `select ps.id, coalesce(ps.stock, 0) as stock, coalesce(ps.total_cost, 0) as total_cost from dtb_product_stock ps
      where ps.product_class_id = $1 and ps.base_info_id = $2 and ps.stock_location_id = $3`,
    [商品規格ID, 店舗ID, 在庫区分番号],
  );
  if (r.length !== 1) throw new Error(`商品規格ID ${商品規格ID}・店舗ID ${店舗ID}・在庫区分 ${在庫区分番号} の在庫が ${r.length} 件（1件のはず）`);
  return { 在庫ID: String(r[0].id), 在庫数: Number(r[0].stock), 総原価: Number(r[0].total_cost) };
}

/** 在庫IDの在庫 */
export function 在庫の(在庫ID: string): 在庫 {
  const r = query(`select ps.id, coalesce(ps.stock, 0) as stock, coalesce(ps.total_cost, 0) as total_cost from dtb_product_stock ps where ps.id = $1`, [在庫ID]);
  if (r.length !== 1) throw new Error(`在庫ID ${在庫ID} の在庫が無い`);
  return { 在庫ID: String(r[0].id), 在庫数: Number(r[0].stock), 総原価: Number(r[0].total_cost) };
}

// ---- 書き足し（画面で指定できない状態だけ。シード表の投入方法のとおり） ----

/** 画面で作った E2E の規格の在庫に、在庫数・総原価を書き足す */
export function 在庫数と総原価を整える(what: string, 在庫ID: string, 在庫数: number, 総原価: number): void {
  updateOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [在庫ID], set: { stock: 在庫数, total_cost: 総原価 }, owner: 自分の在庫 });
}

/** 画面で作った E2E の商品を、削除済み（公開ステータス「廃止」）にする */
export function 商品を削除済みにする(what: string, 商品ID: string): void {
  updateOwnRows(what, { table: "dtb_product", key: "id", ids: [商品ID], set: { product_status_id: 3 }, owner: 自分の商品 });
}

/** 画面で作った E2E の商品規格を、削除済み（公開ステータス「廃止」）にする */
export function 規格を削除済みにする(what: string, 商品規格ID: string): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [商品規格ID], set: { product_status_id: 3 }, owner: 自分の規格 });
}

/** 画面で取り込んだ E2E のファイル（実行の印つきのファイル名）の取込の記録と在庫編集の承認の登録日時を、指定の日時（UTC の ISO）にする */
export function 取込の登録日時を戻す(what: string, ファイル名: string, 日時: string): void {
  const r = query(`select c.id, c.stock_edit_id from dtb_stock_edit_csv c where c.file_name = $1`, [ファイル名]);
  if (r.length === 0) throw new Error(`${what}: ファイル「${ファイル名}」の取込の記録が無い`);
  updateOwnRows(`${what}（取込の記録）`, { table: "dtb_stock_edit_csv", key: "id", ids: r.map((x) => String(x.id)), set: { create_date: 日時 }, owner: 自分の取込の記録 });
  const approvals = [...new Set(r.map((x) => String(x.stock_edit_id)))];
  updateOwnRows(`${what}（在庫編集の承認）`, { table: "dtb_stock_edit_approval", key: "id", ids: approvals, set: { registered_at: 日時 }, owner: 自分の取込の承認 });
}

// ---- 在庫編集承認情報・入庫承認待ち在庫情報・在庫変更履歴 ----

export type 承認情報 = {
  承認ID: string; 承認状態: number; 承認状態の表示: string; 承認対象: string; 店舗ID: string; 店名: string; 在庫区分: string; 対象商品規格数: number | null;
  合計在庫増減数: number | null; 合計総原価増減数: number | null; 在庫変動区分: string; 在庫変動理由: string[]; 登録日時: string; 登録者: string;
  承認日時: string | null; 承認者: string | null; ファイル名: string[]; 保存先: string[];
};

const 承認情報のSQL = `
  select a.id, a.approval_status, coalesce(st.source_name, '') as source_name, a.base_info_id, b.shop_name,
         (case l.stock_location_id when 1 then 'EC-CUBE' when 2 then 'スマレジ' else '' end) as location,
         l.product_stock_total_count, l.inventory_change_total_count, l.total_cost_price_before,
         coalesce(t.name, '') || '/' || coalesce(td.child_name, '') as change_type,
         (select string_agg(distinct d3.stock_change_reason, E'\\n') from dtb_stock_edit_approval_detail d3 where d3.stock_edit_approval_id = a.id) as reasons,
         to_char(a.registered_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as registered_at, rm.name as registrant,
         to_char(a.approved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as approved_at, am.name as approver,
         (select string_agg(c2.file_name, E'\\n' order by c2.id) from dtb_stock_edit_csv c2 where c2.stock_edit_id = a.id) as files,
         (select string_agg(coalesce(c3.s3_object_key, ''), E'\\n' order by c3.id) from dtb_stock_edit_csv c3 where c3.stock_edit_id = a.id) as paths
    from dtb_stock_edit_approval a
    join dtb_base_info b on b.id = a.base_info_id
    left join dtb_stock_approval_list l on l.history_source_id = a.id and l.history_source_type_id = 3
    left join mtb_stock_history_source_type st on st.id = l.history_source_type_id
    left join mtb_stock_change_type_detail td on td.id = a.stock_change_type_detail_id
    left join mtb_stock_change_type t on t.id = td.stock_change_type_id
    left join dtb_member rm on rm.id = a.registered_member_id
    left join dtb_member am on am.id = a.approval_member_id`;

const 承認状態の表示 = (n: number): string => (n === 1 ? "未承認" : n === 2 ? "承認" : n === 3 ? "却下" : String(n));
const 承認情報に = (r: Record<string, string | null>): 承認情報 => ({
  承認ID: String(r.id), 承認状態: Number(r.approval_status), 承認状態の表示: 承認状態の表示(Number(r.approval_status)), 承認対象: String(r.source_name ?? ""),
  店舗ID: String(r.base_info_id), 店名: String(r.shop_name ?? ""), 在庫区分: String(r.location ?? ""), 対象商品規格数: num(r.product_stock_total_count),
  合計在庫増減数: num(r.inventory_change_total_count), 合計総原価増減数: num(r.total_cost_price_before), 在庫変動区分: String(r.change_type ?? ""),
  在庫変動理由: String(r.reasons ?? "").split("\n").filter((x) => x !== ""), 登録日時: String(r.registered_at ?? ""), 登録者: String(r.registrant ?? ""),
  承認日時: r.approved_at, 承認者: r.approver, ファイル名: String(r.files ?? "").split("\n").filter(Boolean), 保存先: String(r.paths ?? "").split("\n").filter(Boolean),
});

/** ファイル名の取込の記録を持つ在庫編集承認情報（承認IDの順） */
export function ファイルの承認情報(ファイル名: string): 承認情報[] {
  return query(`${承認情報のSQL} where exists (select 1 from dtb_stock_edit_csv c where c.stock_edit_id = a.id and c.file_name = $1) order by a.id`, [ファイル名]).map(承認情報に);
}

/** 在庫の明細を持つ在庫編集承認情報（承認IDの順） */
export function 在庫の承認情報(在庫ID: string): 承認情報[] {
  return query(`${承認情報のSQL} where exists (select 1 from dtb_stock_edit_approval_detail d where d.stock_edit_approval_id = a.id and d.product_stock_id = $1) order by a.id`, [在庫ID]).map(承認情報に);
}

/** 承認IDの在庫編集承認情報 */
export function 承認IDの承認情報(承認ID: string): 承認情報 | null {
  return query(`${承認情報のSQL} where a.id = $1`, [承認ID]).map(承認情報に)[0] ?? null;
}

export type 承認待ちの明細 = {
  明細ID: string; 承認ID: string; 承認状態: number; 商品コード: string; 商品名: string; 言語: string; 状態: string; 在庫ID: string; 店舗ID: string; 在庫区分: string;
  在庫変動区分: string; 在庫変動理由: string; 在庫増減数: number; 仕入単価: number | null; 総原価増減数: number | null;
  登録日時: string; 更新日時: string; 登録者: string; 更新者: string;
};

const 明細のSQL = `
  select d.id, d.stock_edit_approval_id, a.approval_status, pc.product_code, p.name as product_name, coalesce(lg.name_jp, '') as language,
         coalesce(cc.code, '') as condition, ps.id as stock_id, ps.base_info_id, ${LOC} as location,
         coalesce(t.name, '') || '/' || coalesce(td.child_name, '') as change_type, d.stock_change_reason, d.edit_quantity,
         d.purchase_unit_price, d.outbound_total_cost,
         to_char(d.create_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as create_date, to_char(d.update_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as update_date,
         rm.name as registrant, um.name as updater
    from dtb_stock_edit_approval_detail d
    join dtb_stock_edit_approval a on a.id = d.stock_edit_approval_id
    join dtb_product_stock ps on ps.id = d.product_stock_id
    join dtb_product_class pc on pc.id = ps.product_class_id
    join dtb_product p on p.id = pc.product_id
    left join mtb_language lg on lg.id = pc.language_id
    left join mtb_card_condition cc on cc.id = pc.card_condition_id
    left join mtb_stock_change_type_detail td on td.id = a.stock_change_type_detail_id
    left join mtb_stock_change_type t on t.id = td.stock_change_type_id
    left join dtb_member rm on rm.id = a.registered_member_id
    left join dtb_member um on um.id = d.member_id`;

const 明細に = (r: Record<string, string | null>): 承認待ちの明細 => ({
  明細ID: String(r.id), 承認ID: String(r.stock_edit_approval_id), 承認状態: Number(r.approval_status), 商品コード: String(r.product_code), 商品名: String(r.product_name),
  言語: String(r.language), 状態: String(r.condition), 在庫ID: String(r.stock_id), 店舗ID: String(r.base_info_id), 在庫区分: String(r.location),
  在庫変動区分: String(r.change_type), 在庫変動理由: String(r.stock_change_reason ?? ""), 在庫増減数: Number(r.edit_quantity),
  仕入単価: num(r.purchase_unit_price), 総原価増減数: num(r.outbound_total_cost), 登録日時: String(r.create_date ?? ""), 更新日時: String(r.update_date ?? ""),
  登録者: String(r.registrant ?? ""), 更新者: String(r.updater ?? ""),
});

/** 承認IDの明細（明細IDの順） */
export function 承認の明細(承認ID: string): 承認待ちの明細[] {
  return query(`${明細のSQL} where d.stock_edit_approval_id = $1 order by d.id`, [承認ID]).map(明細に);
}

/** 在庫IDの在庫に付く明細（明細IDの順） */
export function 在庫の明細(在庫ID: string): 承認待ちの明細[] {
  return query(`${明細のSQL} where d.product_stock_id = $1 order by d.id`, [在庫ID]).map(明細に);
}

/** ファイル名の在庫変更履歴（在庫変更CSV登録履歴の取込の記録）の件数 */
export function ファイルの在庫変更履歴の件数(ファイル名: string): number {
  return Number(query(`select count(*) as n from dtb_stock_edit_csv c where c.file_name = $1`, [ファイル名])[0]?.n ?? 0);
}

/** ファイル名の在庫変更履歴（取込の記録）の番号（記録の順） */
export function ファイルの在庫変更履歴の番号(ファイル名: string): string[] {
  return query(`select c.id from dtb_stock_edit_csv c where c.file_name = $1 order by c.id`, [ファイル名]).map((r) => String(r.id));
}

/** 登録者（メンバーID）の在庫編集承認情報の件数と、そのメンバーの在庫変更履歴（取込の記録）の件数 */
export function 登録者の承認情報と在庫変更履歴の件数(メンバーID: string): { 承認情報: number; 在庫変更履歴: number } {
  const a = Number(query(`select count(*) as n from dtb_stock_edit_approval a where a.registered_member_id = $1`, [メンバーID])[0]?.n ?? 0);
  const c = Number(query(`select count(*) as n from dtb_stock_edit_csv c where c.member_id = $1`, [メンバーID])[0]?.n ?? 0);
  return { 承認情報: a, 在庫変更履歴: c };
}

/** いまの在庫編集の承認の最大ID（操作の前に読み、操作で増えた行を見分ける） */
export function 承認の最大ID(): number {
  return Number(query(`select coalesce(max(a.id), 0) as n from dtb_stock_edit_approval a`)[0]?.n ?? 0);
}

/**
 * 最大ID より後に増えた在庫編集の承認のうち、登録者（メンバーID）・店舗IDのもので、ほかの在庫の明細を持たないもの
 * （この在庫の明細を持つか、明細を持たないもの）の件数。並べて流すほかのケースの登録を数えない。
 */
export function 増えた承認情報の件数(最大ID: number, メンバーID: string, 店舗ID: string, 在庫IDs: string[]): number {
  return Number(query(
    `select count(*) as n from dtb_stock_edit_approval a
      where a.id > $1 and a.registered_member_id = $2 and a.base_info_id = $3
        and not exists (select 1 from dtb_stock_edit_approval_detail d where d.stock_edit_approval_id = a.id
                         and not (d.product_stock_id::text = any(string_to_array($4, ','))))`,
    [最大ID, メンバーID, 店舗ID, 在庫IDs.join(",")],
  )[0]?.n ?? 0);
}

/** 名前のメンバーID（1件であること） */
export function メンバーIDの(名前: string): string {
  const r = query(`select m.id from dtb_member m where m.name = $1`, [名前]);
  if (r.length !== 1) throw new Error(`メンバー「${名前}」が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

// ---- 在庫変動履歴 ----

export type 変動履歴 = {
  履歴ID: string; 商品コード: string; 商品名: string; 言語: string; 状態: string; 店舗ID: string; 在庫区分: string; 在庫変動区分: string; 在庫変動理由: string;
  在庫増減数: number | null; 変更前在庫: number | null; 変更後在庫: number | null; 変更前総原価: number | null; 変更後総原価: number | null;
  変更前原価単価: number | null; 変更後原価単価: number | null; 仕入総価格: number | null; 履歴登録元: string; 履歴登録元ID: string | null;
  承認日時: string | null; 登録日時: string; 登録者: string; 更新日時: string; 更新者: string; ファイル名: string[]; 保存先: string[];
};

/** 在庫の在庫変動履歴（履歴IDの順）。ファイル名・保存先は、登録元が在庫変更CSV登録の行の、登録元の取込の記録 */
export function 在庫の変動履歴(在庫ID: string): 変動履歴[] {
  return query(
    `select h.id, pc.product_code, p.name as product_name, coalesce(lg.name_jp, '') as language, coalesce(cc.code, '') as condition,
            ps.base_info_id, ${LOC} as location, coalesce(t.name, '') || '/' || coalesce(td.child_name, '') as change_type, h.stock_change_reason,
            h.stock_change_quantity, h.old_stock, h.stock, h.total_cost_price_before, h.total_cost_price_after, h.unit_cost_price_before, h.unit_cost_price_after,
            h.buy_price, coalesce(st.source_name, '') as source_name, h.history_source_id,
            to_char(h.approval_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as approval_at, to_char(h.registered_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as registered_at,
            rm.name as registrant, to_char(h.update_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as update_date, um.name as updater,
            (select string_agg(c.file_name, E'\\n' order by c.id) from dtb_stock_edit_csv c where h.history_source_type = 3 and c.stock_edit_id = h.history_source_id) as files,
            (select string_agg(coalesce(c.s3_object_key, ''), E'\\n' order by c.id) from dtb_stock_edit_csv c where h.history_source_type = 3 and c.stock_edit_id = h.history_source_id) as paths
       from dtb_stock_history h
       join dtb_product_stock ps on ps.id = h.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_product p on p.id = pc.product_id
       left join mtb_language lg on lg.id = pc.language_id
       left join mtb_card_condition cc on cc.id = pc.card_condition_id
       left join mtb_stock_change_type_detail td on td.id = h.stock_change_type_detail_id
       left join mtb_stock_change_type t on t.id = td.stock_change_type_id
       left join mtb_stock_history_source_type st on st.id = h.history_source_type
       left join dtb_member rm on rm.id = h.registered_member_id
       left join dtb_member um on um.id = h.update_member_id
      where h.product_stock_id = $1
      order by h.id`,
    [在庫ID],
  ).map((r) => ({
    履歴ID: String(r.id), 商品コード: String(r.product_code), 商品名: String(r.product_name), 言語: String(r.language), 状態: String(r.condition),
    店舗ID: String(r.base_info_id), 在庫区分: String(r.location), 在庫変動区分: String(r.change_type), 在庫変動理由: String(r.stock_change_reason ?? ""),
    在庫増減数: num(r.stock_change_quantity), 変更前在庫: num(r.old_stock), 変更後在庫: num(r.stock), 変更前総原価: num(r.total_cost_price_before),
    変更後総原価: num(r.total_cost_price_after), 変更前原価単価: num(r.unit_cost_price_before), 変更後原価単価: num(r.unit_cost_price_after),
    仕入総価格: num(r.buy_price), 履歴登録元: String(r.source_name), 履歴登録元ID: r.history_source_id, 承認日時: r.approval_at,
    登録日時: String(r.registered_at ?? ""), 登録者: String(r.registrant ?? ""), 更新日時: String(r.update_date ?? ""), 更新者: String(r.updater ?? ""),
    ファイル名: String(r.files ?? "").split("\n").filter(Boolean), 保存先: String(r.paths ?? "").split("\n").filter(Boolean),
  }));
}

/** 在庫編集の承認（承認対象「在庫変更CSV登録」）に対応する、在庫編集承認一覧の行の番号 */
export function 承認一覧の番号(承認ID: string): string {
  const r = query(`select l.id from dtb_stock_approval_list l where l.history_source_type_id = 3 and l.history_source_id = $1`, [承認ID]);
  if (r.length !== 1) throw new Error(`在庫編集の承認 ${承認ID} の在庫編集承認一覧の行が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}
