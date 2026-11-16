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
  /**
   * 受注に商品明細を1件付ける（受注管理編集画面を開くケース用）。受注管理編集の受注の取得（origin/develop OrderRepository::getOrderItemList）は
   * 明細・商品・商品規格を内部結合するので、明細の無い受注は 404 になる（2026-11-13 IT-M08-04-043・ECCUBE_HARERUYA-3968 の検証）。
   */
  商品明細?: boolean;
  /**
   * 受注に、画面で作った受注が必ず持つ配送先1件と支払方法の結び付きを付ける（受注管理編集画面を開くケース用）。
   * 配送先の氏名・住所・電話は会員のものを写し、出荷日は発送日。配送方法・支払方法は既存のマスタの先頭を参照するだけで、マスタは書き換えない。
   * 支払方法の表示名（受注の文字）は「支払方法」のまま。商品明細も付けるときは、明細をこの配送先に結び付ける。
   */
  配送と支払?: boolean;
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
  if (v.配送と支払) 配送と支払を付ける(String(id));
  if (v.商品明細) 商品明細を足す(String(id), v.購入金額);
  return String(id);
}

const 受注の確かめ = (受注ID: string) => ({
  対象の確かめ: `select o.id as 受注ID, c.email as メール from dtb_order o join dtb_customer c on c.id = o.customer_id where o.id = $1::int and c.email like $2`,
  確かめのparams: [受注ID, `%${RUN_MARK}%`] as Sql値[], 印: RUN_MARK,
});

/** 印つきの会員の受注に、配送先1件（会員の氏名・住所を写す）と支払方法の結び付きを付ける。配送方法・支払方法は既存のマスタを参照するだけ */
function 配送と支払を付ける(受注ID: string): void {
  const 配送方法 = query(`select d.id, d.name from dtb_delivery d where d.visible = true order by d.sort_no, d.id limit 1`)[0];
  const 支払 = query(`select p.id from dtb_payment p where p.visible = true order by p.sort_no, p.id limit 1`)[0];
  if (!配送方法 || !支払) throw new Error(`受注ID ${受注ID} に結び付ける配送方法・支払方法が、既存のマスタに無い`);
  writeTestData({
    理由: "足した受注に配送先を1件足す（画面で作った受注は必ず配送先を持ち、受注管理編集画面は配送先を前提に表示する）。配送方法は参照するだけ",
    sql: `insert into dtb_shipping (order_id, customer_id, base_info_id, country_id, pref_id, name01, name02, kana01, kana02, postal_code, addr01, addr02, addr03,
                                    tel01, tel02, tel03, delivery_id, delivery_name, shipping_date, sort_no, create_date, update_date)
          select o.id, c.id, o.base_info_id, c.country_id, c.pref_id, c.name01, c.name02, c.kana01, c.kana02, c.postal_code, c.addr01, c.addr02, c.addr03,
                 c.tel01, c.tel02, c.tel03, $2::int, $3::text, o.shipping_date, 1, now(), now()
            from dtb_order o join dtb_customer c on c.id = o.customer_id
           where o.id = $1::int and not exists (select 1 from dtb_shipping s where s.order_id = o.id)`,
    params: [受注ID, Number(配送方法.id), String(配送方法.name)],
    ...受注の確かめ(受注ID), 最大行数: 1,
  });
  writeTestData({
    理由: "足した受注を既存の支払方法に結び付ける（支払方法の表示名の文字は正本の値のまま）。支払方法は参照するだけ",
    sql: `update dtb_order set payment_id = $2::int where id = $1::int`,
    params: [受注ID, Number(支払.id)],
    ...受注の確かめ(受注ID), 最大行数: 1,
  });
  const n = query(`select count(*) as n from dtb_shipping s where s.order_id = $1::int`, [受注ID])[0]?.n;
  if (Number(n ?? 0) !== 1) throw new Error(`受注ID ${受注ID} に配送先を1件足せなかった`);
}

/**
 * 印つきの会員の受注に、商品明細を1件足す（数量1・単価＝購入金額。受注の合計は変えない）。
 * 商品・商品規格は既存のものを参照するだけで書き換えない（E2E が作った決まった印「-E2E」の商品コードの規格を先に選ぶ。無ければ最小の規格）。
 */
function 商品明細を足す(受注ID: string, 単価: number): void {
  writeTestData({
    理由: "足した受注に商品明細を1件足す（受注管理編集画面は明細・商品・商品規格を伴う受注しか開けない）。商品は参照するだけ",
    // 明細の店舗（base_info_id）は必須の列（m08_01_write.ts と同じ）。足した受注と同じ店舗にする
    sql: `insert into dtb_order_item (order_id, base_info_id, shipping_id, product_id, product_class_id, product_name, product_code, price, quantity, tax, tax_rate, tax_adjust, order_item_type_id)
          select o.id, o.base_info_id, (select min(s.id) from dtb_shipping s where s.order_id = o.id), pc.product_id, pc.id, p.name, pc.product_code, $2::numeric, 1, 0, 10, 0, 1
            from dtb_order o
            cross join lateral (
              select x.id, x.product_id, x.product_code from dtb_product_class x
               where x.product_id is not null
               order by (coalesce(x.product_code, '') like '%-E2E') desc, x.visible desc, x.id
               limit 1) pc
            join dtb_product p on p.id = pc.product_id
           where o.id = $1::int`,
    params: [受注ID, 単価],
    対象の確かめ: `select o.id as 受注ID, c.email as メール from dtb_order o join dtb_customer c on c.id = o.customer_id where o.id = $1::int and c.email like $2`,
    確かめのparams: [受注ID, `%${RUN_MARK}%`], 印: RUN_MARK, 最大行数: 1,
  });
  const r = query(`select count(*) as n from dtb_order_item i where i.order_id = $1::int and i.product_id is not null and i.product_class_id is not null`, [受注ID]);
  if (Number(r[0]?.n ?? 0) !== 1) throw new Error(`受注ID ${受注ID} に商品明細を1件足せなかった`);
}

export type 足す買取 = {
  /** 日本時間の「2026-08-03 12:00」 */
  依頼日時: string;
  申込時金額: number;
  査定金額: number;
  /** 買取状況。名前（買取状況マスタにある名前）か、番号 { ID }。参照するだけ */
  買取状況: string | { ID: number };
};

/**
 * 正本の買取ステータス「査定済み」は、アプリの買取状況マスタ（origin/develop の baseline_database_records.sql の mtb_buy_order_status）に無い。
 * マスタは 1 注文・2 商品到着・3 MTGBuyer査定完了・4 査定内容承諾・… で、査定が済んだ状況に当たるのは
 * 3「MTGBuyer査定完了」（MtbBuyOrderStatus::APPRAISAL_COMPLETE）なので、番号 3 で選ぶ（読み替え。名前では選ばない）。
 */
export const 査定済みに当たる買取状況 = { ID: 3 } as const;

/** 買取状況マスタから1件選ぶ（番号と名前）。無ければ止める */
export function 買取状況を選ぶ(v: string | { ID: number }): { ID: string; 名前: string } {
  const r = typeof v === "string"
    ? query(`select id, name from mtb_buy_order_status where name = $1 order by id limit 1`, [v])
    : query(`select id, name from mtb_buy_order_status where id = $1::int`, [v.ID]);
  if (r.length === 0) throw new Error(`買取状況${typeof v === "string" ? `「${v}」` : ` 番号${v.ID}`}が買取状況マスタに無い`);
  return { ID: String(r[0].id), 名前: String(r[0].name) };
}

/** 印つきの会員の買取を1件足す（買取履歴・買取検索一覧に出る行の元。氏名は会員のものを写す）。買取IDを返す */
export function 買取を足す(会員ID: string, v: 足す買取): string {
  const 状況 = 買取状況を選ぶ(v.買取状況);
  const base = 会員の確かめ(会員ID);
  writeTestData({
    理由: "印つきの会員の買取を1件足す（買取履歴・買取検索一覧の表示の元。買取の新規登録の画面が無い）",
    sql: `insert into dtb_buy_order (customer_id, buy_order_status_id, last_name, first_name, last_name_kana, first_name_kana, email, addr01, addr02, zipcode,
                                     delivery_fee, auto_approval_flg, order_date, update_date, can_transfer_request_flg, transfer_failed_flg, qualified_invoice_issuer_flg, restocked_flg, total_price)
          select c.id, $2::int, c.name01, c.name02, c.kana01, c.kana02, c.email, coalesce(c.addr01, '旧住所1'), coalesce(c.addr02, '旧住所2'), '1000001',
                 0, false, $3::timestamptz, now(), false, false, false, false, $4::int from dtb_customer c where c.id = $1::int`,
    params: [会員ID, 状況.ID, 日本時間(v.依頼日時), v.査定金額],
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
    理由: "印つきの会員に受注を101件足す（購入履歴の100件上限の確認。generate_series の1文。登録日時・注文日時はシード表どおり1分間隔）",
    sql: `insert into dtb_order (customer_id, base_info_id, name01, name02, order_status_id, order_number, total, payment_total, payment_method, create_date, update_date, order_date)
          select c.id, (select min(id) from dtb_base_info), c.name01, c.name02, $2::smallint, (910000 + g.n)::text, 1200, 1200, $3::text,
                 $4::timestamptz + (g.n * interval '1 minute'), now(),
                 $4::timestamptz + (g.n * interval '1 minute')
            from dtb_customer c cross join generate_series(1, 101) as g(n) where c.id = $1::int order by g.n`,
    params: [会員ID, 対応状況のID(["入金済み"]), "試験支払A", 日本時間("2026-08-01 00:00")],
    ...会員の確かめ(会員ID), 最大行数: 101,
  });
}

/** 印つきの会員に、買取を101件足す（依頼日時は2026-08-03 00:01から1分間隔。買取状況は「査定済み」に当たる番号3）。買取IDの（最古, 最新）を返す */
export function 買取を101件足す(会員ID: string): { 最古: string; 最新: string } {
  const 状況 = 買取状況を選ぶ(査定済みに当たる買取状況);
  writeTestData({
    理由: "印つきの会員に買取を101件足す（買取履歴の100件上限の確認。generate_series の1文）",
    sql: `insert into dtb_buy_order (customer_id, buy_order_status_id, last_name, first_name, last_name_kana, first_name_kana, email, addr01, addr02, zipcode,
                                     delivery_fee, auto_approval_flg, order_date, update_date, can_transfer_request_flg, transfer_failed_flg, qualified_invoice_issuer_flg, restocked_flg, total_price)
          select c.id, $2::int, c.name01, c.name02, c.kana01, c.kana02, c.email, coalesce(c.addr01, '旧住所1'), coalesce(c.addr02, '旧住所2'), '1000001',
                 0, false, $3::timestamptz + (g.n * interval '1 minute'), now(), false, false, false, false, 0
            from dtb_customer c cross join generate_series(1, 101) as g(n) where c.id = $1::int order by g.n`,
    params: [会員ID, 状況.ID, 日本時間("2026-08-03 00:00")],
    ...会員の確かめ(会員ID), 最大行数: 101,
  });
  const r = query(`select min(b.id) as a, max(b.id) as z from dtb_buy_order b where b.customer_id = $1::int`, [会員ID])[0];
  return { 最古: String(r.a), 最新: String(r.z) };
}
