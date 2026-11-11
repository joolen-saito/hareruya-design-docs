/**
 * M08-04 会員登録/編集のシードが、画面で作った「実行の印つき」の会員に足す・整えるための DB 書き込み。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換える・親にする会員は、メールアドレスに実行の印を含む会員だけ（対象の確かめの SELECT が返す行がどれも印を含む。含まなければ書かずに止まる）。
 *  - マスタ・設定・ほかの人のデータには書かない。受注・買取の状態や商品は、既存のマスタ・商品を参照するだけ。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 書く理由（画面だけでは作れないもの）:
 *  - 購入履歴の受注・買取履歴の買取: 管理画面に受注・買取を新規登録する画面が無く、フロントの注文は共有の商品の在庫を減らすので、行を足す。
 *  - スマレジID: 画面で入力できない（管理画面の入力欄は編集不可）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";
import { 日本時間, 対応状況のID } from "./m05_01_order_write";

type Sql値 = string | number;

function 会員の確かめ(会員ID: string): { 対象の確かめ: string; 確かめのparams: Sql値[]; 印: string } {
  return {
    対象の確かめ: `select c.id as 会員ID, c.email as メール from dtb_customer c where c.id = $1::int and c.email like $2`,
    確かめのparams: [会員ID, `%${RUN_MARK}%`],
    印: RUN_MARK,
  };
}

export type 足す受注 = {
  /** 受注番号。省略で未設定 */
  注文番号?: string;
  /** 日本時間の「2026-08-01 10:00」 */
  注文日時: string;
  購入金額: number;
  /** 日本時間の「2026-08-02 00:00」。省略で未発送 */
  発送日?: string;
  支払方法: string;
  /** 対応状況の名前（受注の対応状況マスタにある名前。参照するだけ） */
  対応状況: string;
};

/** 印つきの会員の受注を1件足す（購入履歴に出る行の元）。受注IDを返す */
export function 受注を足す(会員ID: string, v: 足す受注): string {
  writeTestData({
    理由: "印つきの会員の受注を1件足す（購入履歴の表示の元。受注の新規登録の画面が無い）",
    sql: `insert into dtb_order (customer_id, base_info_id, name01, name02, order_status_id, order_number, total, payment_total, payment_method, shipping_date, create_date, update_date, order_date)
          select c.id, (select min(id) from dtb_base_info), c.name01, c.name02, $2::smallint, nullif($3::text, ''), $4::numeric, $4::numeric, $5::text,
                 nullif($6::text, '')::timestamptz, now(), now(), $7::timestamptz
            from dtb_customer c where c.id = $1::int`,
    params: [会員ID, 対応状況のID([v.対応状況]), v.注文番号 ?? "", v.購入金額, v.支払方法, v.発送日 ? 日本時間(v.発送日) : "", 日本時間(v.注文日時)],
    ...会員の確かめ(会員ID), 最大行数: 1,
  });
  const found = query(`select max(o.id) as id from dtb_order o where o.customer_id = $1::int`, [会員ID]);
  const id = found[0]?.id;
  if (!id) throw new Error(`足した受注が見つからない（会員ID ${会員ID}）`);
  return String(id);
}

export type 足す買取 = {
  /** 日本時間の「2026-08-03 12:00」 */
  依頼日時: string;
  申込時金額: number;
  査定金額: number;
  /** 買取状況の名前（買取状況マスタにある名前。参照するだけ） */
  買取状況: string;
};

/** 印つきの会員の買取を1件足す（買取履歴・買取検索一覧に出る行の元。氏名は会員のものを写す）。買取IDを返す */
export function 買取を足す(会員ID: string, v: 足す買取): string {
  const 状況 = query(`select id from mtb_buy_order_status where name = $1 order by id limit 1`, [v.買取状況]);
  if (状況.length === 0) throw new Error(`買取状況「${v.買取状況}」が買取状況マスタに無い`);
  const base = 会員の確かめ(会員ID);
  writeTestData({
    理由: "印つきの会員の買取を1件足す（買取履歴・買取検索一覧の表示の元。買取の新規登録の画面が無い）",
    sql: `insert into dtb_buy_order (customer_id, buy_order_status_id, last_name, first_name, last_name_kana, first_name_kana, email, addr01, addr02, zipcode,
                                     delivery_fee, auto_approval_flg, order_date, update_date, can_transfer_request_flg, transfer_failed_flg, qualified_invoice_issuer_flg, restocked_flg, total_price)
          select c.id, $2::int, c.name01, c.name02, c.kana01, c.kana02, c.email, coalesce(c.addr01, '旧住所1'), coalesce(c.addr02, '旧住所2'), '1000001',
                 0, false, $3::timestamptz, now(), false, false, false, false, $4::int from dtb_customer c where c.id = $1::int`,
    params: [会員ID, String(状況[0].id), 日本時間(v.依頼日時), v.査定金額],
    ...base, 最大行数: 1,
  });
  const found = query(`select max(b.id) as id from dtb_buy_order b where b.customer_id = $1::int`, [会員ID]);
  const 買取ID = found[0]?.id;
  if (!買取ID) throw new Error(`足した買取が見つからない（会員ID ${会員ID}）`);
  writeTestData({
    理由: "足した買取の代表カードを1枚足す（査定金額）。商品は既存の商品を参照するだけで書き換えない",
    sql: `insert into dtb_buy_main_card (buy_order_id, product_id, count, price, sale_flg, purchase_category)
          select b.id, (select min(id) from dtb_product), 1, $2::int, true, 1 from dtb_buy_order b where b.id = $1::int`,
    params: [買取ID, v.査定金額],
    対象の確かめ: `select b.id as 買取ID, c.email as メール from dtb_buy_order b join dtb_customer c on c.id = b.customer_id where b.id = $1::int and c.email like $2`,
    確かめのparams: [買取ID, `%${RUN_MARK}%`], 印: RUN_MARK, 最大行数: 1,
  });
  const card = query(`select max(m.id) as id from dtb_buy_main_card m where m.buy_order_id = $1::int`, [買取ID]);
  const cardId = card[0]?.id;
  if (!cardId) throw new Error(`足した代表カードが見つからない（買取ID ${買取ID}）`);
  writeTestData({
    理由: "足した代表カードの申込時買取価格を足す（申込時金額）",
    sql: `insert into dtb_application_price (buy_main_card_id, card_condition_id, application_price)
          select m.id, 1, $2::int from dtb_buy_main_card m where m.id = $1::int`,
    params: [cardId, v.申込時金額],
    対象の確かめ: `select m.id as カードID, c.email as メール from dtb_buy_main_card m join dtb_buy_order b on b.id = m.buy_order_id join dtb_customer c on c.id = b.customer_id where m.id = $1::int and c.email like $2`,
    確かめのparams: [cardId, `%${RUN_MARK}%`], 印: RUN_MARK, 最大行数: 1,
  });
  return String(買取ID);
}

/** 印つきの会員のスマレジIDを設定する（管理画面の入力欄は編集不可で、画面から入れられない） */
export function スマレジIDを設定する(会員ID: string, スマレジID: string): void {
  writeTestData({
    理由: "会員のスマレジIDを設定する（画面で入力できない）",
    sql: `update dtb_player set smaregi_id = $2 where customer_id = $1::int`,
    params: [会員ID, スマレジID],
    対象の確かめ: `select p.id as 本人確認情報ID, c.email as メール from dtb_player p join dtb_customer c on c.id = p.customer_id where c.id = $1::int and c.email like $2`,
    確かめのparams: [会員ID, `%${RUN_MARK}%`], 印: RUN_MARK, 最大行数: 1,
  });
}

/** 印つきの会員に、入金済みの受注を101件足す（受注番号 910001〜910101、注文日時は2026-08-01 00:01から1分間隔）。購入履歴の件数上限の確認用 */
export function 受注を101件足す(会員ID: string): void {
  writeTestData({
    理由: "印つきの会員に受注を101件足す（購入履歴の100件上限の確認。generate_series の1文）",
    sql: `insert into dtb_order (customer_id, base_info_id, name01, name02, order_status_id, order_number, total, payment_total, payment_method, create_date, update_date, order_date)
          select c.id, (select min(id) from dtb_base_info), c.name01, c.name02, $2::smallint, (910000 + g.n)::text, 1200, 1200, $3::text, now(), now(),
                 $4::timestamptz + (g.n * interval '1 minute')
            from dtb_customer c cross join generate_series(1, 101) as g(n) where c.id = $1::int order by g.n`,
    params: [会員ID, 対応状況のID(["入金済み"]), "試験支払A", 日本時間("2026-08-01 00:00")],
    ...会員の確かめ(会員ID), 最大行数: 101,
  });
}

/** 印つきの会員に、買取を101件足す（依頼日時は2026-08-03 00:01から1分間隔）。買取IDの（最古, 最新）を返す */
export function 買取を101件足す(会員ID: string): { 最古: string; 最新: string } {
  const 状況 = query(`select id from mtb_buy_order_status where name = $1 order by id limit 1`, ["査定済み"]);
  if (状況.length === 0) throw new Error("買取状況「査定済み」が買取状況マスタに無い");
  writeTestData({
    理由: "印つきの会員に買取を101件足す（買取履歴の100件上限の確認。generate_series の1文）",
    sql: `insert into dtb_buy_order (customer_id, buy_order_status_id, last_name, first_name, last_name_kana, first_name_kana, email, addr01, addr02, zipcode,
                                     delivery_fee, auto_approval_flg, order_date, update_date, can_transfer_request_flg, transfer_failed_flg, qualified_invoice_issuer_flg, restocked_flg, total_price)
          select c.id, $2::int, c.name01, c.name02, c.kana01, c.kana02, c.email, coalesce(c.addr01, '旧住所1'), coalesce(c.addr02, '旧住所2'), '1000001',
                 0, false, $3::timestamptz + (g.n * interval '1 minute'), now(), false, false, false, false, 0
            from dtb_customer c cross join generate_series(1, 101) as g(n) where c.id = $1::int order by g.n`,
    params: [会員ID, String(状況[0].id), 日本時間("2026-08-03 00:00")],
    ...会員の確かめ(会員ID), 最大行数: 101,
  });
  const r = query(`select min(b.id) as a, max(b.id) as z from dtb_buy_order b where b.customer_id = $1::int`, [会員ID])[0];
  return { 最古: String(r.a), 最新: String(r.z) };
}
