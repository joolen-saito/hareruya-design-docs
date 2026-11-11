// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F06-07 購入履歴詳細のシードが、画面で作った「実行の印つき」の注文を整えるための DB 書き込みと参照。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印を含むメールアドレスの会員が画面で注文した受注・その配送先・その明細・その会員のポイント履歴だけ。
 *    対象の確かめの SELECT が返す行は、どれも印を含む（含まなければ writeTestData が書かずに止める）。
 *  - 支払方法・配送方法・店舗・都道府県・国などのマスタは読むだけ（受注から既存の行を指すだけで、マスタの行は書き換えない）。
 *  - 物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 *
 * 理由: 注文の種別（店頭受取・スマレジ取引）、支払い済みの日時、注文時の単価・数量、送り主・お届け先の住所、ポイント履歴との関連は、
 * フロントの注文の画面では作れない（店頭の取引はスマレジ連携でしか入らない）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";
import { 対応状況のID } from "./m05_01_order_write";

const 印 = RUN_MARK.toUpperCase();
type Sql値 = string | number;

/** 受注が、この実行の印つきのメールアドレスの会員の注文であることを確かめる SELECT（印は大文字にそろえて返す） */
function 確かめ(受注ID: string): { 対象の確かめ: string; 確かめのparams: Sql値[]; 印: string } {
  return {
    対象の確かめ: `select o.id as 受注ID, upper(o.email) as メール from dtb_order o where o.id = $1::int and upper(o.email) like $2`,
    確かめのparams: [受注ID, `%${印}%`],
    印,
  };
}

/** 注文番号の受注ID（この実行の印つきの会員の注文だけ。最新） */
export function 注文の受注ID(注文番号: string): string {
  const r = query(`select o.id from dtb_order o where o.order_number = $1 and upper(o.email) like $2 order by o.id desc limit 1`, [注文番号, `%${印}%`]);
  if (r.length === 0) throw new Error(`注文番号「${注文番号}」の、この実行の印つきの注文が無い`);
  return String(r[0].id);
}

/** 日本時間の「2026-08-10 12:00:00」を時刻つきの値にする */
function 日本時間(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(s)) throw new Error(`日時の形が違う: ${s}`);
  const t = s.length === 10 ? `${s} 12:00:00` : s.length === 16 ? `${s}:00` : s;
  return `${t}+09:00`;
}

class 組み立て {
  readonly sets: string[] = [];
  readonly params: Sql値[] = [];
  p(v: Sql値): string { this.params.push(v); return `$${this.params.length}`; }
  set(col: string, v: Sql値 | null, cast: string): void {
    if (v === null) this.sets.push(`${col} = null`);
    else this.sets.push(`${col} = ${this.p(v)}::${cast}`);
  }
  日時(col: string, v: string | null): void {
    if (v === null) this.sets.push(`${col} = null`);
    else this.sets.push(`${col} = ${this.p(日本時間(v))}::timestamptz`);
  }
}

export type 住所 = {
  国?: "日本" | "アメリカ合衆国";
  /** 区切りなしの郵便番号（国内は7桁、海外はそのまま） */
  郵便番号: string;
  /** 国内の都道府県名。海外は省略（都道府県が「海外」の行があればそれを指す） */
  都道府県?: string;
  住所1: string; 住所2?: string; 住所3?: string;
  /** 姓だけに入れる（名は空） */
  名前: string;
  電話番号: string;
};
export type 明細の値 = { 数量: number; 単価: number | "現在価格と違う値" };
export type 注文の設定 = {
  対応状況?: "出荷完了" | "出荷指示" | "ピック中";
  /** true で支払い済み（入金日を入れる）、false で未払い（入金日なし） */
  支払い済み?: boolean;
  注文日?: string; 出荷日?: string | null;
  /** 支払方法のID（マスタの既存の行を指す） */
  支払方法ID?: number;
  /** 支払方法の名前（あれば指す。無ければそのまま） */
  支払方法名?: string;
  /** 店舗ID（受注・配送先・明細） */
  店舗ID?: string;
  /** 店頭受取（配送方法を店頭受取にする） */
  店頭受取?: boolean;
  /** スマレジ取引（スマレジ取引IDを入れる） */
  スマレジ取引ID?: string;
  レシートNo?: string;
  クーポン名?: string; クーポン値引き?: number; 免税額?: number;
  /** 移行先の受注ID（この注文を店頭受取からスマレジ取引へ移行した移行元にする） */
  移行先の受注ID?: string;
  ポイント使用?: number; ポイント発生?: number;
  /** 明細（商品の行）。商品の行を1件目の行を写して増やし、金額を合計し直す */
  明細?: 明細の値[];
  送料?: number; 手数料?: number; 割引?: number;
  送り主?: 住所; お届け先?: 住所;
};

function 住所を書く(受注ID: string, 表: "dtb_order" | "dtb_shipping", a: 住所): void {
  const o = new 組み立て();
  const 国 = a.国 ?? "日本";
  const 電話 = a.電話番号.split("-");
  if (電話.length > 3) throw new Error(`電話番号は3つまでに区切って書く: ${a.電話番号}`);
  while (電話.length < 3) 電話.push("");
  o.set("name01", a.名前, "text"); o.set("name02", "", "text");
  o.sets.push(`country_id = coalesce((select m.id from mtb_country m where m.name = ${o.p(国)}::text limit 1), country_id)`);
  if (国 === "日本") {
    o.set("postal_code", a.郵便番号, "text"); o.set("abroad_postal_code", null, "text");
    o.sets.push(`pref_id = coalesce((select m.id from mtb_pref m where m.name = ${o.p(a.都道府県 ?? "")}::text limit 1), pref_id)`);
  } else {
    o.set("postal_code", null, "text"); o.set("abroad_postal_code", a.郵便番号, "text");
    o.sets.push(`pref_id = coalesce((select m.id from mtb_pref m where m.name = '海外' limit 1), pref_id)`);
  }
  o.set("addr01", a.住所1, "text"); o.set("addr02", a.住所2 ?? "", "text"); o.set("addr03", a.住所3 ?? "", "text");
  o.set("tel01", 電話[0], "text"); o.set("tel02", 電話[1], "text"); o.set("tel03", 電話[2], "text");
  const id = o.p(受注ID);
  writeTestData({
    理由: `${表 === "dtb_order" ? "送り主" : "お届け先"}の住所を整える`,
    sql: `update ${表} set ${o.sets.join(", ")} where ${表 === "dtb_order" ? "id" : "order_id"} = ${id}::int`,
    params: o.params, ...確かめ(受注ID), 最大行数: 5,
  });
}

/** 印つきの注文を、指定の値に整える（書き換えた内容の短い説明の一覧を返す） */
export function 注文を整える(受注ID: string, v: 注文の設定): string[] {
  const done: string[] = [];
  const o = new 組み立て();
  if (v.対応状況) { o.set("order_status_id", 対応状況のID([v.対応状況]), "smallint"); done.push(`対応状況を「${v.対応状況}」に`); }
  if (v.支払い済み !== undefined) {
    if (v.支払い済み) o.sets.push("payment_date = coalesce(payment_date, now())");
    else o.sets.push("payment_date = null");
    done.push(v.支払い済み ? "支払い済み（入金日あり）に" : "未払い（入金日なし）に");
  }
  if (v.注文日 !== undefined) { o.日時("order_date", v.注文日); done.push(`注文日を ${v.注文日} に`); }
  if (v.出荷日 !== undefined) { o.日時("shipping_date", v.出荷日); done.push(`出荷日を ${v.出荷日 ?? "未設定"} に`); }
  if (v.支払方法ID !== undefined) {
    const r = query(`select id, payment_method from dtb_payment where id = $1::int`, [v.支払方法ID]);
    if (r.length === 0) throw new Error(`支払方法ID ${v.支払方法ID} が支払方法マスタに無い`);
    o.set("payment_id", v.支払方法ID, "int"); o.set("payment_method", String(r[0].payment_method), "text");
    done.push(`支払方法を「${r[0].payment_method}」に`);
  }
  if (v.支払方法名 !== undefined) {
    const r = query(`select id, payment_method from dtb_payment where payment_method = $1 order by id limit 1`, [v.支払方法名]);
    if (r.length > 0) {
      o.set("payment_id", String(r[0].id), "int"); o.set("payment_method", v.支払方法名, "text");
      done.push(`支払方法を「${v.支払方法名}」に`);
    }
  }
  if (v.店舗ID !== undefined) { o.set("base_info_id", v.店舗ID, "int"); done.push(`店舗を店舗ID ${v.店舗ID} に`); }
  if (v.スマレジ取引ID !== undefined) { o.set("smaregi_transaction_id", v.スマレジ取引ID, "text"); done.push(`スマレジ取引IDを ${v.スマレジ取引ID} に`); }
  if (v.レシートNo !== undefined) { o.set("smaregi_receipt_no", v.レシートNo, "text"); done.push(`レシートNo.を ${v.レシートNo} に`); }
  if (v.クーポン名 !== undefined) { o.set("subtotal_discount_division", v.クーポン名, "text"); done.push(`クーポン名を「${v.クーポン名}」に`); }
  if (v.クーポン値引き !== undefined) { o.set("coupon_discount", v.クーポン値引き, "int"); done.push(`クーポン値引きを ${v.クーポン値引き} 円に`); }
  if (v.免税額 !== undefined) { o.set("tax_free", v.免税額, "int"); done.push(`免税額を ${v.免税額} 円に`); }
  if (v.移行先の受注ID !== undefined) { o.set("next_order_id", v.移行先の受注ID, "int"); done.push(`移行先の受注として受注ID ${v.移行先の受注ID} を関連付け`); }
  if (v.ポイント使用 !== undefined) { o.set("spended_points", v.ポイント使用, "int"); done.push(`ポイント使用を ${v.ポイント使用} に`); }
  if (v.ポイント発生 !== undefined) { o.set("gained_points", v.ポイント発生, "bigint"); done.push(`ポイント発生を ${v.ポイント発生} に`); }
  if (v.明細) {
    const 送料 = v.送料 ?? 0, 手数料 = v.手数料 ?? 0, 割引 = v.割引 ?? 0;
    const 小計 = v.明細.reduce((s, m) => s + (typeof m.単価 === "number" ? m.単価 * m.数量 : 0), 0);
    const 違う値 = v.明細.some((m) => m.単価 === "現在価格と違う値");
    if (違う値 && v.明細.length !== 1) throw new Error("「現在価格と違う値」は明細1件のときだけ");
    const 合計 = 小計 + 送料 + 手数料 - 割引;
    // 現在価格と違う値の行は、金額の合計を書き換えない（このときの注文の金額は、画面で注文した値のまま）
    if (!違う値) {
      o.set("subtotal", 小計, "numeric");
      o.set("payment_total", 合計, "numeric"); o.set("total", 合計, "numeric");
      o.set("delivery_fee_total", 送料, "numeric"); o.set("charge", 手数料, "numeric"); o.set("discount", 割引, "numeric");
    }
    done.push(`明細を ${v.明細.map((m) => `${m.数量}点×${m.単価 === "現在価格と違う値" ? "現在価格と違う単価" : m.単価 + "円"}`).join("・")} に（商品金額合計${小計}円・送料${送料}円・手数料${手数料}円・割引${割引}円・注文金額合計${合計}円）`);
  }
  if (o.sets.length > 0) {
    const id = o.p(受注ID);
    writeTestData({ 理由: "注文の整え", sql: `update dtb_order set ${o.sets.join(", ")} where id = ${id}::int`, params: o.params, ...確かめ(受注ID), 最大行数: 1 });
  }

  // 配送先
  const s = new 組み立て();
  if (v.店頭受取) {
    s.sets.push("delivery_id = 6");
    done.push("配送方法を店頭受取に");
  }
  if (v.店舗ID !== undefined) s.set("base_info_id", v.店舗ID, "int");
  if (v.出荷日 !== undefined) s.日時("shipping_date", v.出荷日);
  if (s.sets.length > 0) {
    const id = s.p(受注ID);
    writeTestData({ 理由: "配送先の整え", sql: `update dtb_shipping set ${s.sets.join(", ")} where order_id = ${id}::int`, params: s.params, ...確かめ(受注ID), 最大行数: 5 });
  }

  // 明細
  if (v.店舗ID !== undefined) {
    writeTestData({
      理由: "明細の店舗の整え", sql: `update dtb_order_item set base_info_id = $2::int where order_id = $1::int`, params: [受注ID, v.店舗ID],
      ...確かめ(受注ID), 最大行数: 30,
    });
  }
  if (v.明細) {
    const first = v.明細[0];
    const price = (m: 明細の値) => (m.単価 === "現在価格と違う値"
      ? `((select pc.price02 from dtb_product_class pc where pc.id = i.product_class_id) * 2 + 500)` : `${m.単価}::numeric`);
    writeTestData({
      理由: "先頭の商品の明細の数量と単価を整える",
      sql: `update dtb_order_item i set quantity = ${first.数量}, price = ${price(first)}, tax = 0 where i.id = (
              select min(x.id) from dtb_order_item x where x.order_id = $1::int and x.order_item_type_id = 1)`,
      params: [受注ID], ...確かめ(受注ID), 最大行数: 1,
    });
    const cols = query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = 'dtb_order_item' order by ordinal_position`)
      .map((r) => String(r.column_name)).filter((c) => !["id", "quantity", "price", "tax"].includes(c));
    for (const m of v.明細.slice(1)) {
      writeTestData({
        理由: "商品の明細を写して足す",
        sql: `insert into dtb_order_item (${cols.join(", ")}, quantity, price, tax)
              select ${cols.map((c) => `s.${c}`).join(", ")}, ${m.数量}, ${price(m).replace(/i\./g, "s.")}, 0
                from dtb_order_item s where s.id = (select min(x.id) from dtb_order_item x where x.order_id = $1::int and x.order_item_type_id = 1)`,
        params: [受注ID], ...確かめ(受注ID), 最大行数: 1,
      });
    }
  }
  if (v.送り主) { 住所を書く(受注ID, "dtb_order", v.送り主); done.push(`送り主の住所を（${v.送り主.郵便番号}・${v.送り主.国 ?? "日本"}・${v.送り主.住所1}）に`); }
  if (v.お届け先) { 住所を書く(受注ID, "dtb_shipping", v.お届け先); done.push(`お届け先の住所を（${v.お届け先.郵便番号}・${v.お届け先.国 ?? "日本"}・${v.お届け先.住所1}）に`); }
  return done;
}

/** 注文に紐づくポイント履歴を1件足す（transaction は、スマレジ取引由来の履歴にするときのスマレジ取引ID） */
export function ポイント履歴を足す(受注ID: string, v: { ポイント: number; 発行日: string; 備考: string; スマレジ取引ID?: number }): void {
  writeTestData({
    理由: "注文に紐づくポイント履歴を足す",
    sql: `insert into dtb_point_history (customer_id, order_id, point_change, note, issue_date, create_date, transaction_id)
          select o.customer_id, o.id, $2::int, $3::text, $4::timestamptz, now(), nullif($5::text, '')::int from dtb_order o where o.id = $1::int`,
    params: [受注ID, v.ポイント, v.備考, 日本時間(v.発行日), v.スマレジ取引ID ?? ""],
    ...確かめ(受注ID), 最大行数: 1,
  });
}

// ---- 参照だけ ----

/** 店舗マスタの先頭から n 件（店舗ID・店名）。注文が保持する店舗に使う */
export function 店舗の先頭(n: number): { id: string; 店名: string }[] {
  const r = query(`select id, shop_name from dtb_base_info order by id limit ${Math.floor(n)}`);
  if (r.length < n) throw new Error(`店舗が ${n} 件に足りない（${r.length} 件）`);
  return r.map((x) => ({ id: String(x.id), 店名: String(x.shop_name) }));
}

/** 受注ID の注文が未登録か（注文IDの存在を確かめる） */
export function 注文IDが未登録か(注文ID: string): boolean {
  return query(`select id from dtb_order where id = $1::int`, [注文ID]).length === 0;
}

/** 注文の先頭の商品の、注文時単価・数量・金額（DBの値。比べるために読む） */
export function 注文の金額(注文番号: string): { 注文時単価: string; 数量: string; 商品金額合計: string; 送料: string; 手数料: string; 注文金額合計: string } {
  const r = query(
    `select i.price::text as "注文時単価", i.quantity::text as "数量", o.subtotal::text as "商品金額合計", o.delivery_fee_total::text as "送料", o.charge::text as "手数料", o.payment_total::text as "注文金額合計"
       from dtb_order o join dtb_order_item i on i.order_id = o.id and i.order_item_type_id = 1
      where o.order_number = $1 and upper(o.email) like $2 order by o.id desc, i.id limit 1`, [注文番号, `%${印}%`]);
  if (r.length === 0) throw new Error(`注文番号「${注文番号}」の金額を読めない`);
  return r[0] as { 注文時単価: string; 数量: string; 商品金額合計: string; 送料: string; 手数料: string; 注文金額合計: string };
}

/** 注文の先頭の商品の、いまの商品規格の税抜価格 */
export function 商品の現在価格(注文番号: string): string {
  const r = query(
    `select pc.price02::text as "p" from dtb_order o join dtb_order_item i on i.order_id = o.id and i.order_item_type_id = 1
       join dtb_product_class pc on pc.id = i.product_class_id
      where o.order_number = $1 and upper(o.email) like $2 order by o.id desc, i.id limit 1`, [注文番号, `%${印}%`]);
  if (r.length === 0) throw new Error(`注文番号「${注文番号}」の商品の現在価格を読めない`);
  return String(r[0].p);
}

/** 注文のポイント使用・ポイント発生 */
export function 注文のポイント(注文番号: string): { 使用: string; 発生: string } {
  const r = query(`select coalesce(o.spended_points, 0)::text as "u", coalesce(o.gained_points, 0)::text as "g" from dtb_order o where o.order_number = $1 and upper(o.email) like $2 order by o.id desc limit 1`, [注文番号, `%${印}%`]);
  if (r.length === 0) throw new Error(`注文番号「${注文番号}」のポイントを読めない`);
  return { 使用: String(r[0].u), 発生: String(r[0].g) };
}
