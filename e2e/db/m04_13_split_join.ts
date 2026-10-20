/**
 * M04-13 在庫分割結合登録編集の DB確認（参照だけ）。物理名はここの SQL の中にだけ書く。
 * 呼び出す側には業務の言葉で見せる。金額・数量は数（Number）にして返す。日時は 1970年からの秒（数）で返す。
 */
import { query } from "../lib/db";

const n = (v: string | null | undefined): number | null => (v === null || v === undefined ? null : Number(v));

export type 在庫分割結合 = {
  ID: string;
  処理タイプ: "在庫分割" | "在庫結合" | string;
  ステータス: string;
  在庫ID: string;
  店舗: string;
  在庫区分番号: number;
  商品コード: string;
  商品名: string;
  基準価格: number | null;
  原価単価: number | null;
  総原価: number | null;
  在庫数: number | null;
  分割結合数: number | null;
  メモ: string | null;
  出庫総原価: number | null;
  却下理由: string | null;
  登録日時: number | null;
  更新日時: number | null;
  登録者: string | null;
  更新者: string | null;
  承認日時: number | null;
  承認者: string | null;
};

const HEAD_SQL = `
  select sj.id::text as id,
         case sj.split_join_type when 1 then '在庫分割' when 2 then '在庫結合' else sj.split_join_type::text end as kind,
         st.name as status, ps.id::text as stock_id, bi.shop_name as shop, ps.stock_location_id::text as loc,
         pc.product_code as code, p.name as pname,
         sj.standard_price::text as standard_price, sj.unit_cost_price::text as unit_cost, sj.total_cost::text as total_cost,
         sj.stock::text as stock, sj.split_join_quantity::text as qty, sj.split_join_memo as memo,
         sj.outbound_total_cost::text as outbound, sj.rejected_memo as rejected,
         extract(epoch from sj.create_date)::text as created, extract(epoch from sj.update_date)::text as updated,
         rm.name as registrant, um.name as updater,
         extract(epoch from sj.move_to_approval_at)::text as approved_at, am.name as approver
    from dtb_stock_split_join sj
    join mtb_stock_split_join_status st on st.id = sj.stock_split_join_status_id
    join dtb_product_stock ps on ps.id = sj.product_stock_id
    join dtb_base_info bi on bi.id = ps.base_info_id
    join dtb_product_class pc on pc.id = ps.product_class_id
    join dtb_product p on p.id = pc.product_id
    left join dtb_member rm on rm.id = sj.registered_member_id
    left join dtb_member um on um.id = sj.update_member_id
    left join dtb_member am on am.id = sj.move_to_approval_member_id`;

function toHead(r: Record<string, string | null>): 在庫分割結合 {
  return {
    ID: r.id ?? "", 処理タイプ: r.kind ?? "", ステータス: r.status ?? "", 在庫ID: r.stock_id ?? "", 店舗: r.shop ?? "",
    在庫区分番号: Number(r.loc), 商品コード: r.code ?? "", 商品名: r.pname ?? "",
    基準価格: n(r.standard_price), 原価単価: n(r.unit_cost), 総原価: n(r.total_cost), 在庫数: n(r.stock), 分割結合数: n(r.qty),
    メモ: r.memo, 出庫総原価: n(r.outbound), 却下理由: r.rejected,
    登録日時: n(r.created), 更新日時: n(r.updated), 登録者: r.registrant, 更新者: r.updater, 承認日時: n(r.approved_at), 承認者: r.approver,
  };
}

/** 在庫分割結合IDの基本情報（無ければ null） */
export function 在庫分割結合(id: string): 在庫分割結合 | null {
  const rows = query(`${HEAD_SQL} where sj.id = $1::int`, [id]);
  return rows.length ? toHead(rows[0]) : null;
}

/** 分割元・結合先が、店舗の商品コードの在庫である在庫分割結合（ID の順） */
export function 商品コードの在庫分割結合(code: string, shop: string, kind?: "在庫分割" | "在庫結合"): 在庫分割結合[] {
  const type = kind === undefined ? null : kind === "在庫分割" ? 1 : 2;
  return query(`${HEAD_SQL} where pc.product_code = $1 and bi.shop_name = $2 and ($3 = '' or sj.split_join_type = nullif($3, '')::int) order by sj.id`,
    [code, shop, type === null ? "" : String(type)]).map(toHead);
}

export type 登録時の商品名 = {
  /** 在庫分割結合の基本情報の表に、登録時の商品名を保存する項目があるか */
  保存先: boolean;
  /** 保存された値（項目が無ければ null） */
  値: string | null;
};

/**
 * 在庫分割結合の基本情報に保存された「登録時の商品名」（設計書: 分割は「[分割元]商品名 在庫分割作成時の商品名」、
 * 結合は「[結合先]商品名 在庫結合登録時の商品名」）。表に項目が無いときは、保存先が無いことを返す（項目の名前は決まった候補からだけ選ぶ）。
 * 基本情報の照会（在庫分割結合）の商品名は、在庫から商品マスターをたどって読む今の商品名で、登録時に保存した値ではない。
 * 比べれば必ずシードの商品名と一致するので、期待結果の「登録時の商品名を持つ」の確かめには使わない（2026-10-20 のレビューの指摘）。
 */
export function 登録時の商品名(id: string): 登録時の商品名 {
  const 項目 = new Set(query(`select column_name as c from information_schema.columns where table_name = 'dtb_stock_split_join'`).map((r) => r.c ?? ""));
  const 名前の項目 = ["product_name", "subject_product_name", "destination_product_name", "source_product_name", "name"].find((c) => 項目.has(c));
  if (!名前の項目) return { 保存先: false, 値: null };
  const rows = query(`select sj.${名前の項目}::text as v from dtb_stock_split_join sj where sj.id = $1::int`, [id]);
  return { 保存先: true, 値: rows.length ? rows[0].v : null };
}

export type 明細 = {
  明細ID: string; 在庫ID: string; 商品コード: string; 商品名: string; 店舗: string; 在庫区分番号: number;
  基準価格: number | null; 原価単価: number | null; 仕入総価格: number | null; 分割先総原価の控え: number | null; 在庫数: number | null;
  数量: number | null; 欠品点数: number | null; 欠品登録者: string | null;
};

/**
 * 在庫分割結合の明細（分割先・結合元）。明細IDの順。
 * 仕入総価格は、明細の「総原価」の項目を読む。アプリはこの項目を、分割では承認申請のときに按分した仕入総価格（承認のときに分割先の総原価へ足す値）、
 * 結合ではフッターの結合元商品登録のとき（設計書が仕入総価格を計算すると定める時点）に書く（アプリの明細の定義と、分割の明細を作る処理の説明）。
 * 分割先総原価の控えは、承認申請のときの分割先の在庫の総原価の写しで、仕入総価格ではない。
 * 2026-10-20 まではこの写しを仕入総価格として読んでいた（E2E側の誤り。028 で、分割先の在庫の総原価 500・800 が仕入総価格として出て見つかった）。
 */
export function 明細(id: string): 明細[] {
  return query(`
    select d.id::text as id, ps.id::text as stock_id, pc.product_code as code, p.name as pname, bi.shop_name as shop, ps.stock_location_id::text as loc,
           d.standard_price::text as standard_price, d.cost_price::text as cost_price, d.total_cost::text as total_cost,
           d.destination_total_cost::text as dest_total_cost, d.stock::text as stock, d.split_join_quantity::text as qty,
           d.missing_quantity::text as missing, mm.name as missing_member
      from dtb_stock_split_join_detail d
      join dtb_product_stock ps on ps.id = d.subject_product_stock_id
      join dtb_base_info bi on bi.id = ps.base_info_id
      join dtb_product_class pc on pc.id = ps.product_class_id
      join dtb_product p on p.id = pc.product_id
      left join dtb_member mm on mm.id = d.missing_member_id
     where d.stock_split_join_id = $1::int
     order by d.id`, [id]).map((r) => ({
    明細ID: r.id ?? "", 在庫ID: r.stock_id ?? "", 商品コード: r.code ?? "", 商品名: r.pname ?? "", 店舗: r.shop ?? "", 在庫区分番号: Number(r.loc),
    基準価格: n(r.standard_price), 原価単価: n(r.cost_price), 仕入総価格: n(r.total_cost), 分割先総原価の控え: n(r.dest_total_cost), 在庫数: n(r.stock),
    数量: n(r.qty), 欠品点数: n(r.missing), 欠品登録者: r.missing_member,
  }));
}

export type 明細の登録更新 = {
  /** 明細の表に、それぞれを保存する項目があるか */
  保存先: Record<"登録日時" | "更新日時" | "登録者" | "更新者", boolean>;
  /** 明細ごとの値（項目が無いものは null）。明細IDの順 */
  行: { 商品コード: string; 登録日時: number | null; 更新日時: number | null; 登録者: string | null; 更新者: string | null }[];
};

/**
 * 在庫分割結合の明細（分割先・結合元）の、登録日時・更新日時・登録者・更新者の値。
 * 明細の表に項目が無いときは、保存先が無いことを返し、値は null にする（項目の名前は決まった候補からだけ選ぶ）。
 */
export function 明細の登録更新(id: string): 明細の登録更新 {
  const 項目 = new Set(query(`select column_name as c from information_schema.columns where table_name = 'dtb_stock_split_join_detail'`).map((r) => r.c ?? ""));
  const 登録者の項目 = ["registered_member_id", "creator_id"].find((c) => 項目.has(c));
  const 保存先 = { 登録日時: 項目.has("create_date"), 更新日時: 項目.has("update_date"), 登録者: 登録者の項目 !== undefined, 更新者: 項目.has("update_member_id") };
  const rows = query(`
    select pc.product_code as code,
           ${保存先.登録日時 ? "extract(epoch from d.create_date)::text" : "null::text"} as created,
           ${保存先.更新日時 ? "extract(epoch from d.update_date)::text" : "null::text"} as updated,
           ${登録者の項目 ? "rm.name" : "null::text"} as registrant,
           ${保存先.更新者 ? "um.name" : "null::text"} as updater
      from dtb_stock_split_join_detail d
      join dtb_product_stock ps on ps.id = d.subject_product_stock_id
      join dtb_product_class pc on pc.id = ps.product_class_id
      ${登録者の項目 ? `left join dtb_member rm on rm.id = d.${登録者の項目}` : ""}
      ${保存先.更新者 ? "left join dtb_member um on um.id = d.update_member_id" : ""}
     where d.stock_split_join_id = $1::int
     order by d.id`, [id]);
  return {
    保存先,
    行: rows.map((r) => ({ 商品コード: r.code ?? "", 登録日時: n(r.created), 更新日時: n(r.updated), 登録者: r.registrant, 更新者: r.updater })),
  };
}

export type 明細の登録時の商品名 = {
  /** 明細の表に、登録時の商品名を保存する項目があるか */
  保存先: boolean;
  /** 明細ごとの値（項目が無ければ null）。明細IDの順 */
  行: { 商品コード: string; 値: string | null }[];
};

/**
 * 在庫分割結合の明細（分割先・結合元）に保存された「登録時の商品名」（設計書 sheet-19 の結合元商品登録処理: 「[結合元]商品名 在庫先登録時の商品名」）。
 * 表に項目が無いときは、保存先が無いことを返す（項目の名前は決まった候補からだけ選ぶ。基本情報の「登録時の商品名」と同じ作り）。
 * 明細の照会（明細）の商品名は、在庫から商品マスターをたどって読む今の商品名で、登録時に保存した値ではない（比べれば必ず一致する）。
 */
export function 明細の登録時の商品名(id: string): 明細の登録時の商品名 {
  const 項目 = new Set(query(`select column_name as c from information_schema.columns where table_name = 'dtb_stock_split_join_detail'`).map((r) => r.c ?? ""));
  const 名前の項目 = ["product_name", "subject_product_name", "source_product_name", "destination_product_name", "name"].find((c) => 項目.has(c));
  const rows = query(`
    select pc.product_code as code, ${名前の項目 ? `d.${名前の項目}::text` : "null::text"} as v
      from dtb_stock_split_join_detail d
      join dtb_product_stock ps on ps.id = d.subject_product_stock_id
      join dtb_product_class pc on pc.id = ps.product_class_id
     where d.stock_split_join_id = $1::int
     order by d.id`, [id]);
  return { 保存先: 名前の項目 !== undefined, 行: rows.map((r) => ({ 商品コード: r.code ?? "", 値: r.v })) };
}

export type ステータス履歴 = { ステータス: string; 更新者: string | null; 更新日時: number | null };

/** ステータス変更履歴（登録の順） */
export function ステータス履歴(id: string): ステータス履歴[] {
  return query(`
    select st.name as status, m.name as member, extract(epoch from h.update_date)::text as at
      from dtb_stock_split_join_status_history h
      join mtb_stock_split_join_status st on st.id = h.stock_split_join_status_id
      left join dtb_member m on m.id = h.update_member_id
     where h.stock_split_join_id = $1::int
     order by h.id`, [id]).map((r) => ({ ステータス: r.status ?? "", 更新者: r.member, 更新日時: n(r.at) }));
}

export type 在庫 = { 在庫ID: string; 在庫数: number; 総原価: number };

/** 店舗・在庫区分（1=EC-CUBE、2=スマレジ）の、商品コードの在庫（無ければ null。複数あれば落とす） */
export function 在庫(code: string, shop: string, location: number): 在庫 | null {
  const rows = query(`
    select ps.id::text as id, coalesce(ps.stock, 0)::text as stock, ps.total_cost::text as total_cost
      from dtb_product_stock ps
      join dtb_product_class pc on pc.id = ps.product_class_id
      join dtb_base_info bi on bi.id = ps.base_info_id
     where pc.product_code = $1 and bi.shop_name = $2 and ps.stock_location_id = $3::int`, [code, shop, location]);
  if (rows.length > 1) throw new Error(`商品コード ${code}・店舗 ${shop}・在庫区分 ${location} の在庫が ${rows.length} 件ある`);
  return rows.length ? { 在庫ID: rows[0].id ?? "", 在庫数: Number(rows[0].stock), 総原価: Number(rows[0].total_cost) } : null;
}

/** 在庫IDの在庫 */
export function 在庫IDの在庫(stockId: string): 在庫 | null {
  const rows = query(`select ps.id::text as id, coalesce(ps.stock, 0)::text as stock, ps.total_cost::text as total_cost from dtb_product_stock ps where ps.id = $1::int`, [stockId]);
  return rows.length ? { 在庫ID: rows[0].id ?? "", 在庫数: Number(rows[0].stock), 総原価: Number(rows[0].total_cost) } : null;
}

export type 在庫変動履歴 = {
  履歴ID: string; 在庫変動区分: string; 在庫変動理由: string | null; 増減数: number | null; 変更前在庫: number | null; 変更後在庫: number | null;
  変更前総原価: number | null; 変更後総原価: number | null; 登録元: string | null; 登録元ID: string | null; 登録者: string | null; 登録日時: number | null;
  /** 履歴の行が書かれた日時。操作（承認・却下など）が書いた履歴を、操作の前後の時刻で見分けるときはこれを使う */
  作成日時: number | null;
};

/**
 * 在庫IDの在庫変動履歴（登録の順）。登録元（在庫分割・在庫結合など）で絞れる。
 * 登録日時は、アプリが履歴に持たせる「登録日時」（無ければ行が書かれた日時）。アプリは、分割・結合の承認・却下で書く履歴の登録日時に、
 * 在庫分割結合の登録の日時を入れる（承認の日時は別の項目）。そのため、操作が書いた履歴を時刻で見分けるときは作成日時を使う
 * （2026-10-20 まで登録日時で見分けていて、031・033 で承認・却下が書いた履歴を見落とした。E2E側の誤り）。
 */
export function 在庫変動履歴(stockId: string, source?: string): 在庫変動履歴[] {
  return query(`
    select h.id::text as id, ctd.child_name as type, h.stock_change_reason as reason, h.stock_change_quantity::text as qty,
           h.old_stock::text as old_stock, h.stock::text as stock,
           h.total_cost_price_before::text as tc_before, h.total_cost_price_after::text as tc_after,
           hst.source_name as source, h.history_source_id::text as source_id,
           coalesce(rm.name, h.operator_member_name) as member, extract(epoch from coalesce(h.registered_at, h.create_date))::text as at,
           extract(epoch from h.create_date)::text as created
      from dtb_stock_history h
      join mtb_stock_change_type_detail ctd on ctd.id = h.stock_change_type_detail_id
      left join mtb_stock_history_source_type hst on hst.id = h.history_source_type
      left join dtb_member rm on rm.id = h.registered_member_id
     where h.product_stock_id = $1::int and ($2 = '' or hst.source_name = $2)
     order by h.id`, [stockId, source ?? ""]).map((r) => ({
    履歴ID: r.id ?? "", 在庫変動区分: r.type ?? "", 在庫変動理由: r.reason, 増減数: n(r.qty), 変更前在庫: n(r.old_stock), 変更後在庫: n(r.stock),
    変更前総原価: n(r.tc_before), 変更後総原価: n(r.tc_after), 登録元: r.source, 登録元ID: r.source_id, 登録者: r.member, 登録日時: n(r.at),
    作成日時: n(r.created),
  }));
}

/** いまの DB の時刻（1970年からの秒）。登録日時が操作の前後に入るかを比べる基準 */
export function DBの時刻(): number {
  return Number(query(`select extract(epoch from now())::text as now_epoch`)[0].now_epoch);
}
