/**
 * M06-04（買取ステータス変更）のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文ずつ・印の確かめ・行数の上限・ログ）。
 *
 * 書く先は、E2E が画面（フロントの店頭買取査定申込）で作った「実行の印つき」の買取（申込者の名に実行の印）と、その買取に紐づく行
 * （明細・個別入力商品・実在庫）だけ。ほかの買取は、その印つきの買取の申込者情報を写して DB で足す（名に同じ印を付ける）。
 * 買取集計の行は、印つきの買取に紐づけて足す・消す。消してよいのは「買取店舗A・B の、その日の集計」だけで、
 * その日に集計対象の実データ（印の無い、金額のある買取）が無いことを確かめてから消す（あれば止める）。
 *
 * 買取集計の再集計（ステータス変更で走る）は、その日の集計を作り直す。前の実行の印つきの買取が同じ日を成立日に持っていると
 * 合計が合わなくなるので、前の実行（と、同じ日を使う別ケース）の印つきの買取は、買取成立日を空にして集計から外す。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

/** 店頭買取ステータスの番号（アプリの定数。名前の表記の揺れに頼らない） */
export const 状態の番号: Record<string, number> = {
  買取成立: 1, 買取キャンセル: 2, ダブルチェック済み: 3, データ出力済み: 4, 査定前: 5, 査定中: 6, 査定中断: 8, 査定再開: 9,
  経理払い出し待ち: 10, 入庫済み: 11, 未登録在庫あり: 12, 入庫待ち: 13, 管理者取消: 14,
};
/** 買取集計の対象のステータス（アプリの定数） */
const 集計対象 = "1,11,12,13";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
function 番号(状態: string): number {
  const n = 状態の番号[状態];
  if (!n) throw new Error(`店頭買取のステータス「${状態}」の番号を知らない`);
  return n;
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

const 親の確かめ = "select o.id, o.first_name from dtb_otc_buy_order o where o.id = $1::int";

/** 日本時間の日（YYYY-MM-DD）の始まりと終わり（排他）の条件。列 col に当てる */
const 日の範囲 = (col: string, p: string) =>
  `${col} >= (${p}::date)::timestamp at time zone 'Asia/Tokyo' and ${col} < ((${p}::date) + 1)::timestamp at time zone 'Asia/Tokyo'`;

export type 買取の値 = {
  状態: string;
  /** 買取成立日（日本時間 'YYYY-MM-DD HH:MM:SS'。null は空） */
  成立日: string | null;
  /** 査定合計金額（空にするなら null） */
  合計金額: number | null;
  キャンセル日?: string | null;
  入庫日時?: string | null;
};

/** 印つきの買取の、ステータス・買取成立日・査定合計金額（・買取キャンセル日・入庫日時）を整える */
export function 買取を整える(受注ID: string, 印: string, v: 買取の値): void {
  const n = writeTestData({
    理由: `買取 ${受注ID} をステータス「${v.状態}」・買取成立日 ${v.成立日 ?? "空"}・査定合計金額 ${v.合計金額 ?? "空"} にする`,
    sql: `update dtb_otc_buy_order set otc_buy_order_status_id = $2::int,
            complete_date = (nullif($3, '')::timestamp) at time zone 'Asia/Tokyo',
            total_price = nullif($4, '')::int,
            cancel_date = (nullif($5, '')::timestamp) at time zone 'Asia/Tokyo',
            restocked_date = (nullif($6, '')::timestamp) at time zone 'Asia/Tokyo'
          where id = $1::int`,
    params: [数字(受注ID), 番号(v.状態), v.成立日 ?? "", v.合計金額 === null ? "" : v.合計金額, v.キャンセル日 ?? "", v.入庫日時 ?? ""],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  });
  一件(n, "買取の更新");
}

export type 明細の値 = { 部門ID: string; 買取金額: number; 販売金額: number; 数量?: number; 商品コード?: string };

/** 印つきの買取に、買取明細を1件足す（商品コードを与えると、その商品規格＝商品マスタ登録済みの明細） */
export function 明細を足す(受注ID: string, 印: string, m: 明細の値): void {
  if (m.商品コード) {
    const k = Number(query("select count(*) as n from dtb_product_class where product_code = $1", [m.商品コード])[0].n);
    if (k !== 1) throw new Error(`商品コード ${m.商品コード} の商品規格が ${k} 件（1件のはず）`);
  }
  const n = writeTestData({
    理由: `買取 ${受注ID} に買取明細（部門${m.部門ID}・買取${m.買取金額}・販売${m.販売金額}${m.商品コード ? `・商品 ${m.商品コード}` : ""}）を足す`,
    sql: `insert into dtb_otc_buy_order_detail (otc_buy_order_id, section_id, price, sell_price, original_quantity, product_class_id)
          select o.id, $2::int, $3::int, $4::int, $5::int, (select pc.id from dtb_product_class pc where pc.product_code = nullif($6, ''))
            from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(受注ID), 数字(m.部門ID), m.買取金額, m.販売金額, m.数量 ?? 1, m.商品コード ?? ""],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  });
  一件(n, "買取明細");
}

export type 個別入力の値 = { 名前: string; 部門ID: string; 買取金額: number; 販売金額: number; 数量?: number };

/** 印つきの買取に、個別入力商品を1件足す（商品規格なし＝実在庫未登録） */
export function 個別入力商品を足す(受注ID: string, 印: string, v: 個別入力の値): void {
  const n = writeTestData({
    理由: `買取 ${受注ID} に個別入力商品（${v.名前}・部門${v.部門ID}・買取${v.買取金額}・販売${v.販売金額}）を足す`,
    sql: `insert into dtb_otc_buy_order_indivisual_input_product (otc_buy_order_id, name, section_id, price, sell_price, quantity)
          select o.id, $2, $3::int, $4::int, $5::int, $6::int from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(受注ID), v.名前, 数字(v.部門ID), v.買取金額, v.販売金額, v.数量 ?? 1],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  });
  一件(n, "個別入力商品");
}

/** 印つきの買取に、実在庫明細（入庫の対象）を1件足す（商品は商品コードの商品規格） */
export function 実在庫明細を足す(受注ID: string, 印: string, 商品コード: string, 数量: number, 小計: number): void {
  const n = writeTestData({
    理由: `買取 ${受注ID} に実在庫明細（${商品コード}・数量${数量}・小計${小計}）を足す`,
    sql: `insert into dtb_otc_buy_order_stock (otc_buy_order_id, product_class_id, quantity, subtotal)
          select o.id, pc.id, $3::int, $4::int from dtb_otc_buy_order o join dtb_product_class pc on pc.product_code = $2 where o.id = $1::int`,
    params: [数字(受注ID), 商品コード, 数量, 小計],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  });
  一件(n, "実在庫明細");
}

export type 写しの値 = { 査定ID: string; 名: string; 状態: string; 成立日: string | null; 合計金額: number | null; 店舗ID?: string };

/** 印つきの買取の申込者情報を写して、買取をもう1件足す（名は印つきの値を渡す）。足した買取の店頭買取受注IDを返す */
export function 買取を写して足す(元の受注ID: string, 印: string, v: 写しの値): string {
  const n = writeTestData({
    理由: `買取 ${元の受注ID} の申込者情報を写して、買取 ${v.査定ID}（${v.状態}・成立日 ${v.成立日 ?? "空"}）を足す`,
    sql: `insert into dtb_otc_buy_order (otc_buy_order_status_id, assessment_id, last_name, first_name, last_name_kana, first_name_kana,
            addr01, addr02, addr03, zipcode, birth, tel_no, base_info_id, total_price, apply_date, complete_date, country_id, pref_id, job_id, update_date)
          select $2::int, $3, o.last_name, $4, o.last_name_kana, o.first_name_kana,
                 o.addr01, o.addr02, o.addr03, o.zipcode, o.birth, o.tel_no, coalesce(nullif($5, '')::int, o.base_info_id), nullif($6, '')::int,
                 o.apply_date, (nullif($7, '')::timestamp) at time zone 'Asia/Tokyo', o.country_id, o.pref_id, o.job_id, now()
            from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(元の受注ID), 番号(v.状態), v.査定ID, v.名, v.店舗ID ?? "", v.合計金額 === null ? "" : v.合計金額, v.成立日 ?? ""],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(元の受注ID)], 印, 最大行数: 1,
  });
  一件(n, "買取の追加");
  const r = query("select id from dtb_otc_buy_order where assessment_id = $1", [v.査定ID]);
  if (r.length !== 1) throw new Error(`足した買取（査定ID ${v.査定ID}）が ${r.length} 件`);
  return String(r[0].id);
}

/**
 * 同じ日を成立日に持つ、前の実行（や同じ日を使う別ケース）の印つきの買取を、買取成立日を空にして集計から外す。
 * 名の先頭が 名の先頭（各 4 文字以上）で始まる買取だけ。自分の買取（除く受注ID）は外さない。外した件数を返す。
 */
export function 前の買取を集計から外す(日: string, 名の先頭: string[], 除く受注ID: string[]): number {
  let total = 0;
  for (const p of 名の先頭) {
    if (p.length < 4) throw new Error(`名の先頭「${p}」が短い（4文字以上）`);
    const where = `${日の範囲("o.complete_date", "$1")} and o.first_name like $2 || '%' and o.id <> all (string_to_array($3, ',')::int[])`;
    const params = [日, p, 除く受注ID.map(数字).join(",") || "0"];
    const rows = query(`select o.id, o.first_name from dtb_otc_buy_order o where ${where}`, params);
    if (rows.length === 0) continue;
    total += writeTestData({
      理由: `${日} を買取成立日に持つ、名が「${p}」で始まる前の印つきの買取 ${rows.length} 件を、買取成立日を空にして集計から外す`,
      sql: `update dtb_otc_buy_order set complete_date = null where id in (select o.id from dtb_otc_buy_order o where ${where})`,
      params,
      対象の確かめ: `select o.id, o.first_name from dtb_otc_buy_order o where ${where}`, 確かめのparams: params, 印: p, 最大行数: 50,
    });
  }
  return total;
}

/** その日を成立日に持つ、集計対象の、金額のある買取のうち、印つきのもの以外の件数（実データの有無の確かめ） */
export function 実データの買取の件数(日: string, 名の先頭: string[], 除く受注ID: string[]): number {
  const r = query(
    `select count(*) as n from dtb_otc_buy_order o
      where ${日の範囲("o.complete_date", "$1")} and o.otc_buy_order_status_id in (${集計対象})
        and o.id <> all (string_to_array($2, ',')::int[])
        and not (o.first_name like any (string_to_array($3, ',')))
        and (coalesce(o.total_price, 0) > 0
             or exists (select 1 from dtb_otc_buy_order_detail d where d.otc_buy_order_id = o.id and d.original_quantity > 0)
             or exists (select 1 from dtb_otc_buy_order_indivisual_input_product i where i.otc_buy_order_id = o.id and i.quantity > 0))`,
    [日, 除く受注ID.map(数字).join(",") || "0", 名の先頭.map((p) => `${p}%`).join(",")]);
  return Number(r[0].n);
}

/** 買取店舗の、その日の買取集計の件数 */
export function 集計の件数(日: string, 店舗ID: string[]): number {
  return Number(query(
    `select count(*) as n from dtb_otc_buy_order_summary s where (s.summary_date at time zone 'Asia/Tokyo')::date = $1::date and s.base_info_id = any (string_to_array($2, ',')::int[])`,
    [日, 店舗ID.map(数字).join(",")])[0].n);
}

/** 買取店舗の、その日の買取集計を消す（先に 実データの買取の件数 が0であることを確かめる）。部門IDを渡すとその部門だけ */
export function その日の集計を消す(親の受注ID: string, 印: string, 日: string, 店舗ID: string[], 部門ID?: string): number {
  const params = [日, 店舗ID.map(数字).join(","), 部門ID ? 数字(部門ID) : ""];
  const where = `(s.summary_date at time zone 'Asia/Tokyo')::date = $1::date and s.base_info_id = any (string_to_array($2, ',')::int[]) and ($3 = '' or s.section_id = nullif($3, '')::int)`;
  if (Number(query(`select count(*) as n from dtb_otc_buy_order_summary s where ${where}`, params)[0].n) === 0) return 0;
  return writeTestData({
    理由: `${日} の買取店舗の買取集計${部門ID ? `（部門${部門ID}）` : ""}を消す（その日に集計対象の実データの買取が無いことを確かめたあと。印つきの買取 ${親の受注ID} の集計の土台）`,
    sql: `delete from dtb_otc_buy_order_summary s where ${where}`,
    params,
    // 対象の確かめは、集計の行に印つきの買取（足す土台）の名を並べて返す。その日に実データの買取が無いことは呼び出し側が先に確かめている
    対象の確かめ: `select s.id, o.first_name from dtb_otc_buy_order_summary s join dtb_otc_buy_order o on o.id = $4::int where ${where}`,
    確かめのparams: [...params, 数字(親の受注ID)], 印, 最大行数: 20,
  });
}

/** 印つきの買取に紐づけて、既存の買取集計の行を1件足す（日は日本時間の日。0時で入る） */
export function 集計を足す(親の受注ID: string, 印: string, 日: string, 店舗ID: string, 部門ID: string, 買取金額: number, 販売金額: number): void {
  const n = writeTestData({
    理由: `${日} の買取集計（店舗${店舗ID}・部門${部門ID}・買取${買取金額}・販売${販売金額}）を足す（印つきの買取 ${親の受注ID} の集計）`,
    sql: `insert into dtb_otc_buy_order_summary (base_info_id, section_id, sell_price, buy_price, summary_date)
          select $3::int, $4::int, $6::int, $5::int, ($2::date)::timestamp at time zone 'Asia/Tokyo' from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(親の受注ID), 日, 数字(店舗ID), 数字(部門ID), 買取金額, 販売金額],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(親の受注ID)], 印, 最大行数: 1,
  });
  一件(n, "買取集計");
}

/** 印つきの会員の買取（買取番号＝査定ID）の査定合計金額を設定する。印は会員のメールアドレス（実行の印つき） */
export function 会員の買取の査定合計金額を設定する(買取番号: string, 印: string, 金額: number): void {
  const n = writeTestData({
    理由: `会員の買取 ${買取番号} の査定合計金額を ${金額} にする`,
    sql: `update dtb_otc_buy_order set total_price = $2::int where assessment_id = $1 and customer_id in (select c.id from dtb_customer c where c.email like $3 || '%')`,
    params: [買取番号, 金額, 印],
    対象の確かめ: `select o.id, c.email from dtb_otc_buy_order o join dtb_customer c on c.id = o.customer_id where o.assessment_id = $1`, 確かめのparams: [買取番号], 印, 最大行数: 1,
  });
  一件(n, "会員の買取の更新");
}
