/**
 * F06-06 購入履歴一覧のシードが、画面で作った「実行の印つき」の注文を整えるための DB 書き込みと参照。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 * 注文の基本の整え（注文日・店舗・店頭受取・スマレジ取引・移行先・支払方法）は db/f06_07.ts の 注文を整える を使い、ここには足りない分だけ足す。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印を含むメールアドレスの会員が画面で注文した受注とその明細・配送先だけ（対象の確かめが印を含まない行を返せば writeTestData が止める）。
 *  - 対応状況・配送方法・店舗・商品・支払方法のマスタは読むだけ（受注から既存の行を指すだけで、マスタの行は書き換えない）。
 *  - 物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK.toUpperCase();

function 確かめ(受注ID: string): { 対象の確かめ: string; 確かめのparams: (string | number)[]; 印: string } {
  return {
    対象の確かめ: `select o.id as 受注ID, upper(o.email) as メール from dtb_order o where o.id = $1::int and upper(o.email) like $2`,
    確かめのparams: [受注ID, `%${印}%`],
    印,
  };
}

/**
 * 対応状況の名前から ID を引く。「購入済み」は、この環境の対応状況マスタに同じ名前が無く、購入済みの意味で使われている
 * 「引渡し済み」で読み替える（呼び出し側が注記に残す）。
 */
export const 対応状況の別名: Record<string, string> = { 購入済み: "引渡し済み" };
export function 対応状況のID(名前: string): { id: string; 実際の名前: string } {
  for (const 実際 of [名前, 対応状況の別名[名前]].filter(Boolean)) {
    const r = query(`select id from mtb_order_status where name = $1 order by id limit 1`, [実際]);
    if (r.length > 0) return { id: String(r[0].id), 実際の名前: 実際 };
  }
  throw new Error(`対応状況「${名前}」が対応状況マスタに無い`);
}

/** 印つきの注文の対応状況を設定する（画面の状態遷移では作れない状態に使う） */
export function 対応状況を設定(受注ID: string, 名前: string): string {
  const { id, 実際の名前 } = 対応状況のID(名前);
  writeTestData({
    理由: `対応状況を「${実際の名前}」にする`,
    sql: `update dtb_order set order_status_id = $2::smallint where id = $1::int`,
    params: [受注ID, id], ...確かめ(受注ID), 最大行数: 1,
  });
  return 実際の名前;
}

/** 配送方法をスムーズ店頭受取にする（フロントの注文では、店舗の閲覧と配送方法の条件で選べないことがある） */
export function 配送方法をスムーズ店頭受取にする(受注ID: string): void {
  writeTestData({
    理由: "配送方法をスムーズ店頭受取にする",
    sql: `update dtb_shipping set delivery_id = 7 where order_id = $1::int`,
    params: [受注ID], ...確かめ(受注ID), 最大行数: 5,
  });
}

/** 注文が保持する注文金額合計（画面で指定できない値）を設定する */
export function 注文金額合計を設定(受注ID: string, 金額: number): void {
  writeTestData({
    理由: "注文金額合計を設定する",
    sql: `update dtb_order set payment_total = $2::numeric where id = $1::int`,
    params: [受注ID, 金額], ...確かめ(受注ID), 最大行数: 1,
  });
}

/** 先頭の商品の明細の数量を設定する */
export function 先頭の明細の数量を設定(受注ID: string, 数量: number): void {
  writeTestData({
    理由: "先頭の商品の明細の数量を設定する",
    sql: `update dtb_order_item set quantity = $2::numeric where id = (
            select min(x.id) from dtb_order_item x where x.order_id = $1::int and x.order_item_type_id = 1)`,
    params: [受注ID, 数量], ...確かめ(受注ID), 最大行数: 1,
  });
}

/** 販売中の別の商品（先頭の商品と違う商品）の商品IDと規格ID。購入履歴の明細に足す */
export function 別の販売中の商品(受注ID: string, 除く: string[] = []): { 商品ID: string; 規格ID: string; 商品名: string } {
  const r = query(
    `select p.id::text as "商品ID", pc.id::text as "規格ID", p.name as "商品名"
       from dtb_product p join dtb_product_class pc on pc.product_id = p.id and pc.visible
      where p.product_status_id = 1 and pc.sale_type_id = 1 and p.name not like '%予約%'
        and p.id <> all (select i.product_id from dtb_order_item i where i.order_id = $1::int and i.product_id is not null)
      order by p.id limit 20`, [受注ID]);
  const hit = r.find((x) => !除く.includes(String(x.商品ID)));
  if (!hit) throw new Error("明細に足せる販売中の別の商品が手元のDBに見つからない");
  return { 商品ID: String(hit.商品ID), 規格ID: String(hit.規格ID), 商品名: String(hit.商品名) };
}

/** 先頭の明細を写して、別の商品の明細を足す（金額は先頭の明細のまま） */
export function 別の商品の明細を足す(受注ID: string, 商品: { 商品ID: string; 規格ID: string; 商品名: string }, 数量: number): void {
  const cols = query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = 'dtb_order_item' order by ordinal_position`)
    .map((r) => String(r.column_name)).filter((c) => c !== "id");
  const 置き換え: Record<string, string> = {
    product_id: "$2::int", product_class_id: "$3::int", product_name: "$4::text", product_code: "null", quantity: "$5::numeric",
  };
  writeTestData({
    理由: "別の商品の明細を足す",
    sql: `insert into dtb_order_item (${cols.join(", ")})
          select ${cols.map((c) => 置き換え[c] ?? `s.${c}`).join(", ")}
            from dtb_order_item s where s.id = (select min(x.id) from dtb_order_item x where x.order_id = $1::int and x.order_item_type_id = 1)`,
    params: [受注ID, 商品.商品ID, 商品.規格ID, 商品.商品名, 数量], ...確かめ(受注ID), 最大行数: 1,
  });
}

// ---- 参照だけ ----

/** 店舗を名前で探す。無ければ店舗マスタの序数番目（0始まり）の店舗で代える（代えたら 代替 が true） */
export function 店を探す(名前: string, 序数: number): { id: string; 店名: string; 代替: boolean } {
  const hit = query(`select id, shop_name from dtb_base_info where shop_name = $1 order by id limit 1`, [名前]);
  if (hit.length > 0) return { id: String(hit[0].id), 店名: String(hit[0].shop_name), 代替: false };
  const all = query(`select id, shop_name from dtb_base_info order by id`);
  const r = all[Math.min(序数, all.length - 1)];
  if (!r) throw new Error("店舗マスタに店舗が無い");
  return { id: String(r.id), 店名: String(r.shop_name), 代替: true };
}

/** 注文日を、画面と同じ「2026/8/5」の形で（日本時間） */
export function 注文日の表示(受注ID: string): string {
  const r = query(`select to_char(order_date at time zone 'Asia/Tokyo', 'YYYY/FMMM/FMDD') as d from dtb_order where id = $1::int`, [受注ID]);
  if (r.length === 0 || !r[0].d) throw new Error(`受注ID ${受注ID} の注文日を読めない`);
  return String(r[0].d);
}

/** 注文の商品名（明細の並び順） */
export function 注文の商品名(受注ID: string): string[] {
  return query(
    `select p.name as n from dtb_order_item i join dtb_product p on p.id = i.product_id
      where i.order_id = $1::int and i.order_item_type_id = 1 order by i.id`, [受注ID]).map((r) => String(r.n));
}

/** 対応状況・各対応状況のマスタ・支払方法・店舗の有無（S-F06-06-MASTER の確かめ。読むだけ） */
export function マスタの有無(): { 無い対応状況: string[]; 無い支払方法: string[]; 無い店舗: string[] } {
  const 状況 = ["ピック中", "入金待ち", "入金済み", "ピック完了", "出荷指示", "店頭予約", "出荷完了", "購入済み", "キャンセル"];
  const have = new Set(query(`select name from mtb_order_status`).map((r) => String(r.name)));
  const pay = new Set(query(`select payment_method from dtb_payment`).map((r) => String(r.payment_method)));
  const shop = new Set(query(`select shop_name from dtb_base_info`).map((r) => String(r.shop_name)));
  return {
    無い対応状況: 状況.filter((s) => !have.has(s) && !have.has(対応状況の別名[s] ?? s)),
    無い支払方法: ["クレジットカード", "店頭支払"].filter((s) => !pay.has(s)),
    無い店舗: ["晴れる屋本店", "晴れる屋高松店"].filter((s) => !shop.has(s)),
  };
}
