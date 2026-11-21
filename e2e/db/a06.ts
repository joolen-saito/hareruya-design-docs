/**
 * A06（MTGBuyer の API）のシード・確かめのための DB の参照。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 読むのは lib/db.ts の query（参照だけ）。書くのは、画面で指定できない値（店頭買取の受注の本人確認証明書ID・更新担当者）だけで、
 * E2E が画面（フロントの店頭買取査定申込）で作った、申込者の姓に実行の印を付けた受注の行にだけ、db/write_adapter.ts の writeTestData
 * （lib/db_write.ts の窓口を通す）で書く（依頼者決定 2026-11-10「E2E が作った行だけ DB に書いてよい」）。共有のマスタ・メンバーは書き換えない。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

/** 管理者（メンバー）の名前と所属店舗 */
export function 管理者の(管理者ID: string): { 名前: string; 所属店舗ID: string } | null {
  const r = query("select name, base_info_id::text as b from dtb_member where id = $1::int", [管理者ID])[0];
  return r ? { 名前: String(r.name ?? ""), 所属店舗ID: String(r.b ?? "") } : null;
}

/** ログインIDの管理者の数 */
export function ログインIDの管理者の数(ログインID: string): number {
  return Number(query("select count(*) as n from dtb_member where login_id = $1", [ログインID])[0]?.n ?? 0);
}

/** 店舗の店名と住所（ログイン応答の店舗住所は住所の1行目と2行目をつなげた値） */
export function 店舗の(店舗ID: string): { 店名: string; 住所1: string; 住所2: string } | null {
  const r = query("select shop_name, addr01, addr02 from dtb_base_info where id = $1::int", [店舗ID])[0];
  return r ? { 店名: String(r.shop_name ?? ""), 住所1: String(r.addr01 ?? ""), 住所2: String(r.addr02 ?? "") } : null;
}

/** 店頭買取の受注（フリーコメント・更新担当者・ステータス・本人確認証明書） */
export function 店頭買取の受注(受注ID: string): { フリーコメント: string | null; 更新担当者ID: string | null; ステータスID: string; 本人確認証明書ID: string | null; 店舗ID: string; 更新日時: string } | null {
  const r = query(`select free_comment, member_id::text as m, otc_buy_order_status_id::text as s, identification_id::text as i, base_info_id::text as b,
                          to_char(update_date, 'YYYY-MM-DD HH24:MI:SS.US') as u
                   from dtb_otc_buy_order where id = $1::int`, [受注ID])[0];
  return r ? { フリーコメント: r.free_comment, 更新担当者ID: r.m, ステータスID: String(r.s ?? ""), 本人確認証明書ID: r.i, 店舗ID: String(r.b ?? ""), 更新日時: String(r.u ?? "") } : null;
}

/**
 * 申込の完了画面の番号から、店頭買取の査定ID（yyyymmdd-店舗ID-番号）を引く（2026-11-20。完了画面の番号は査定IDの末尾の通し番号で、
 * 査定IDそのものではない。そのまま査定IDとして引くと「受注が DB に無い」で止まっていた）。査定IDの形ならそのまま返す。
 * 同じ番号が日をまたいで重ならないよう、申込日時が直近2時間の受注に限り、いちばん新しいものを使う。
 */
export function 申込番号の査定ID(番号: string): string {
  if (/^\d{8}-\d+-\d+$/.test(番号)) return 番号;
  if (!/^\d+$/.test(番号)) throw new Error(`申込の完了画面の番号 ${番号} が数字でない`);
  const r = query("select assessment_id as a from dtb_otc_buy_order where assessment_id like $1 and apply_date > (now() at time zone 'utc') - interval '2 hours' order by id desc limit 1", [`%-${番号}`]);
  if (!r[0]?.a) throw new Error(`申込の完了画面の番号 ${番号} の店頭買取の受注が、直近2時間に無い`);
  return String(r[0].a);
}

/** 査定IDの店頭買取の受注ID（無ければ null） */
export function 査定IDの受注ID(査定ID: string): string | null {
  const r = query("select id::text as id from dtb_otc_buy_order where assessment_id = $1", [査定ID]);
  if (r.length > 1) throw new Error(`査定ID ${査定ID} の店頭買取の受注が ${r.length} 件ある`);
  return r[0]?.id ?? null;
}

/** 受注IDの店頭買取の受注があるか */
export function 店頭買取の受注がある(受注ID: string): boolean {
  return Number(query("select count(*) as n from dtb_otc_buy_order where id = $1::int", [受注ID])[0]?.n ?? 0) > 0;
}

/** 店頭買取ステータスの名称 */
export function 店頭買取ステータスの名称(ID: string): string | null {
  return query("select name from mtb_otc_buy_order_status where id = $1::int", [ID])[0]?.name ?? null;
}

/** 店頭買取の申込で使うマスタ（職業・国・都道府県）に、その名称の行があるか */
export function 申込のマスタにある(マスタ: "職業" | "国" | "都道府県", 名称: string): boolean {
  const 表 = { 職業: "mtb_job", 国: "mtb_country", 都道府県: "mtb_pref" }[マスタ];
  return Number(query(`select count(*) as n from ${表} where name = $1`, [名称])[0]?.n ?? 0) > 0;
}

/** 本人確認証明書の名称（無ければ null） */
export function 本人確認証明書の名称(ID: string): string | null {
  return query("select name from mtb_identification where id = $1::int", [ID])[0]?.name ?? null;
}

/** 印つきの姓の店頭買取の受注に、本人確認証明書IDと更新担当者を書く（画面で指定できない値。シード表の作り方） */
export function 本人確認証明書と更新担当者を書く(受注ID: string, 本人確認証明書ID: string, 管理者ID: string, 印つきの姓: string): void {
  if (![受注ID, 本人確認証明書ID, 管理者ID].every((v) => /^\d+$/.test(v))) throw new Error(`番号が数字でない（${受注ID}・${本人確認証明書ID}・${管理者ID}）`);
  const n = writeTestData({
    理由: `E2E の店頭買取の受注 ${受注ID} に、本人確認証明書ID ${本人確認証明書ID} と更新担当者（管理者ID ${管理者ID}）を書く`,
    sql: "update dtb_otc_buy_order set identification_id = $2::int, member_id = $3::int where id = $1::int",
    params: [受注ID, 本人確認証明書ID, 管理者ID],
    対象の確かめ: "select o.id, o.last_name from dtb_otc_buy_order o where o.id = $1::int", 確かめのparams: [受注ID],
    印: 印つきの姓, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`受注 ${受注ID} の本人確認証明書・更新担当者の書き込みが ${n} 行（1行のはず）`);
}

/** カード詳細IDのカード詳細の数 */
export function カード詳細の数(カード詳細ID: string): number {
  return Number(query("select count(*) as n from mtb_card_detail where id = $1::int", [カード詳細ID])[0]?.n ?? 0);
}

/** 追加システム設定の固定価格商品部門IDの今の値（行が無ければ null） */
export function 固定価格商品部門IDの設定(): string | null {
  const r = query("select option_value from mtb_option where option_key = 'fixed_price_section'");
  return r.length ? (r[0].option_value ?? "") : null;
}

/** 部門IDの部門の数 */
export function 部門IDの部門の数(部門ID: string): number {
  return Number(query("select count(*) as n from mtb_section where id = $1::int", [部門ID])[0]?.n ?? 0);
}

/** 部門コードの部門の数 */
export function 部門コードの部門の数(部門コード: string): number {
  return Number(query("select count(*) as n from mtb_section where code = $1", [部門コード])[0]?.n ?? 0);
}

/** 商品名がその文字列で始まる商品の数 */
export function 名前で始まる商品の数(頭: string): number {
  return Number(query("select count(*) as n from dtb_product where name like $1", [`${頭.replace(/[%_]/g, "\\$&")}%`])[0]?.n ?? 0);
}

/**
 * この実行で作った商品の公開ステータスを、DB で「廃止」（3）にする（2026-11-21。在庫を入れたあとの商品は、商品登録編集画面で
 * 「在庫がある商品規格は廃止にできません」となり、画面では作れない。シード表は入庫のあとに削除済み（廃止）とするので、E2E の商品にだけ書く）
 */
export function 商品をDBで廃止にする(what: string, 商品ID: string): void {
  updateOwnRows(what, {
    table: "dtb_product", key: "id", ids: [商品ID], set: { product_status_id: 3 },
    owner: { sql: "select p.id from dtb_product p where exists (select 1 from dtb_product_class pc where pc.product_id = p.id and pc.product_code like $1)", params: [`%-${RUN_MARK}`] },
  });
  const r = query("select product_status_id::text as s from dtb_product where id = $1::int", [商品ID])[0];
  if (String(r?.s ?? "") !== "3") throw new Error(`${what}: 商品公開ステータスを DB で廃止にしたが、読み戻すと「${r?.s}」`);
}
