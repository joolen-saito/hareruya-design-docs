/**
 * M05-01 受注管理（受注情報検索）のシードが、画面で作った「実行の印つき」の受注を整えるための DB 書き込み。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印を含む商品コードの明細を持つ受注（画面でシードが作った受注と、その複製）だけ。
 *    対象の確かめの SELECT が返す行は、どれも印を含む（含まなければ writeTestData が書かずに止める）。
 *  - 追加（複製）の親は、印つきの受注（または印つきの受注を持つ会員）。マスタ・設定・ほかの人のデータには書かない。
 *  - 物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 *
 * 複製の理由: 注文番号は画面が8桁で振り、受注の新規登録の画面も無い。11文字までの接頭辞つきの注文番号の組、
 * 指定の日時・区分・金額、非会員、別の店舗の受注は、画面で作れない。1件だけ画面で作った受注（基の受注）の
 * 受注・配送先・明細の行を写して作る（lib/db_write.ts の対象の確かめは、基の受注の明細の商品コードの印で確かめる）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK;
type Sql値 = string | number;

/** 受注（または、その受注の明細）が、この実行の印つきの商品コードを持つことを確かめる SELECT */
function 受注の確かめ(受注ID: string): { 対象の確かめ: string; 確かめのparams: Sql値[]; 印: string } {
  return {
    対象の確かめ: `select o.id as 受注ID, i.product_code as 商品コード from dtb_order o join dtb_order_item i on i.order_id = o.id
                    where o.id = $1::int and i.product_code like $2`,
    確かめのparams: [受注ID, `%${印}%`],
    印,
  };
}

/** 日本時間の「2026-09-15 12:00:00」を、時刻つきの値に直す */
export function 日本時間(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)) throw new Error(`日時の形が違う: ${s}（YYYY-MM-DD HH:MM:SS）`);
  return `${s}${s.length === 16 ? ":00" : ""}+09:00`;
}

/** 実行日（日本時間）の n 日前の hh:mm:ss */
export function 実行日のn日前(n: number, 時刻 = "12:00:00"): string {
  const jst = new Date(Date.now() + 9 * 3600_000 - n * 86400_000);
  return `${jst.toISOString().slice(0, 10)} ${時刻}`;
}

/** 表の列名（id と除く列）を、information_schema から読む（参照だけ） */
function 列(表: string, 除く: string[]): string[] {
  const rows = query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position`, [表]);
  const cols = rows.map((r) => String(r.column_name)).filter((c) => !除く.includes(c));
  if (cols.length === 0) throw new Error(`表 ${表} の列を読めない`);
  return cols;
}

/** 対応状況の名前（候補の先頭から探す）→ ID。画面の選択肢に無い状態（引渡し済みなど）はこれで DB に入れる */
export function 対応状況のID(候補: string[]): string {
  for (const name of 候補) {
    const rows = query(`select id from mtb_order_status where name = $1`, [name]);
    if (rows.length > 0) return String(rows[0].id);
  }
  throw new Error(`対応状況「${候補.join("・")}」が対応状況マスタに無い`);
}

export type 日時 = string | null;
export type 受注の整え = {
  注文番号?: string;
  受注日?: 日時; 入金日?: 日時; 出荷指示日?: 日時; 出荷日?: 日時; キャンセル日?: 日時; 売上確定日?: 日時; 店頭予約日?: 日時; 更新日?: string;
  /** 購入金額（購入金額と合計の両方） */
  購入金額?: number;
  注文備考?: string | null; ショップ用メモ?: string | null; 注文者会社名?: string | null; 注文者セイ?: string;
  氏名?: [string, string]; 性別ID?: 1 | 2; 送り状No?: string | null;
  /** 対応状況の名前（候補。先頭から探す） */
  対応状況?: string[];
  /** 支払方法の表示名（支払方法設定画面で登録した、印つきのもの。支払方法マスタの行を受注に結びつける） */
  支払方法?: string;
  /** 支払方法の表示名の文字だけを変える（マスタの行は結びつけない。一覧の支払方法の列の表示用） */
  支払方法の表示名?: string;
  スマレジ連携エラー?: boolean; 当日受取?: boolean; スマレジ取引ID?: string | null;
  /** 引渡し後の受注ID（この受注の引渡し後の受注として関連付ける） */
  引渡し後の受注ID?: string | null;
  /** 注文者の会員ID（null で非会員） */
  会員ID?: string | null;
  /** 店舗ID（受注・配送先・明細の店舗） */
  店舗ID?: string;
  配送先?: { 住所1?: string; 住所2?: string; 姓?: string; 名?: string; 会社名?: string; 配送方法ID?: string; 配送方法名?: string };
  /** 受注明細の商品コード（全明細） */
  明細の商品コード?: string;
  /** 受注明細を n 件に増やす（1件目を写して足す） */
  明細数?: number;
};

class 組み立て {
  readonly sets: string[] = [];
  readonly params: Sql値[] = [];
  p(v: Sql値): string { this.params.push(v); return `$${this.params.length}`; }
  set(col: string, v: Sql値 | null, cast = ""): void {
    if (v === null) this.sets.push(`${col} = null`);
    else this.sets.push(`${col} = ${this.p(v)}${cast}`);
  }
  日時(col: string, v: 日時): void {
    if (v === null) this.sets.push(`${col} = null`);
    else this.sets.push(`${col} = ${this.p(日本時間(v))}::timestamptz`);
  }
}

function 書く(理由: string, 受注ID: string, sql: string, params: Sql値[], 最大行数 = 1): number {
  return writeTestData({ 理由, sql, params, ...受注の確かめ(受注ID), 最大行数 });
}

/** 印つきの受注を、指定の値に整える（書き換えた内容の短い説明の一覧を返す） */
export function 受注を整える(受注ID: string, v: 受注の整え): string[] {
  const done: string[] = [];
  const o = new 組み立て();
  if (v.注文番号 !== undefined) { o.set("order_number", v.注文番号, "::text"); done.push(`注文番号を ${v.注文番号} に`); }
  const dates: [string, string, 日時 | undefined][] = [
    ["受注日", "order_date", v.受注日], ["入金日", "payment_date", v.入金日], ["出荷指示日", "commit_date", v.出荷指示日], ["出荷日", "shipping_date", v.出荷日],
    ["キャンセル日", "cancel_date", v.キャンセル日], ["売上確定日", "receipt_date", v.売上確定日], ["店頭予約日", "otc_rsv_date", v.店頭予約日],
  ];
  for (const [label, col, val] of dates) {
    if (val === undefined) continue;
    o.日時(col, val);
    done.push(`${label}を ${val ?? "未入力"} に`);
  }
  if (v.購入金額 !== undefined) {
    o.set("payment_total", v.購入金額, "::numeric"); o.set("total", v.購入金額, "::numeric");
    done.push(`購入金額を ${v.購入金額} 円に`);
  }
  if (v.注文備考 !== undefined) { o.set("message", v.注文備考, "::text"); done.push(`注文備考を ${v.注文備考 ?? "未入力"} に`); }
  if (v.ショップ用メモ !== undefined) { o.set("note", v.ショップ用メモ, "::text"); done.push(`ショップ用メモを ${v.ショップ用メモ ?? "未入力"} に`); }
  if (v.注文者会社名 !== undefined) { o.set("company_name", v.注文者会社名, "::text"); done.push(`注文者会社名を ${v.注文者会社名 ?? "未入力"} に`); }
  if (v.注文者セイ !== undefined) { o.set("kana01", v.注文者セイ, "::text"); done.push(`注文者のセイを ${v.注文者セイ} に`); }
  if (v.氏名) { o.set("name01", v.氏名[0], "::text"); o.set("name02", v.氏名[1], "::text"); done.push(`注文者の姓名を ${v.氏名.join(" ")} に`); }
  if (v.性別ID !== undefined) { o.set("sex_id", v.性別ID, "::smallint"); done.push(`注文者の性別を ${v.性別ID === 1 ? "男性" : "女性"} に`); }
  if (v.送り状No !== undefined) { o.set("invoice_number", v.送り状No, "::text"); done.push(`送り状No.を ${v.送り状No ?? "未入力"} に`); }
  if (v.対応状況) { o.set("order_status_id", 対応状況のID(v.対応状況), "::smallint"); done.push(`対応状況を ${v.対応状況[0]} に`); }
  if (v.支払方法 !== undefined) {
    const pay = query(`select id from dtb_payment where payment_method = $1 order by id desc limit 1`, [v.支払方法]);
    if (pay.length === 0) throw new Error(`支払方法「${v.支払方法}」が無い`);
    o.set("payment_id", String(pay[0].id), "::int"); o.set("payment_method", v.支払方法, "::text");
    done.push(`支払方法を ${v.支払方法} に`);
  }
  if (v.支払方法の表示名 !== undefined) { o.set("payment_method", v.支払方法の表示名, "::text"); done.push(`支払方法の表示名を ${v.支払方法の表示名} に`); }
  if (v.スマレジ連携エラー !== undefined) { o.sets.push(`smaregi_error_flg = ${v.スマレジ連携エラー ? "true" : "false"}`); done.push(`スマレジ連携エラー区分を${v.スマレジ連携エラー ? "立てた" : "立てない"}`); }
  if (v.当日受取 !== undefined) { o.sets.push(`pickup_today = ${v.当日受取 ? "true" : "false"}`); done.push(`当日受取区分を${v.当日受取 ? "あり" : "なし"}に`); }
  if (v.スマレジ取引ID !== undefined) { o.set("smaregi_transaction_id", v.スマレジ取引ID, "::text"); done.push(v.スマレジ取引ID === null ? "スマレジ取引IDを空に" : "スマレジ由来区分（スマレジ取引ID）を設定"); }
  if (v.引渡し後の受注ID !== undefined) { o.set("next_order_id", v.引渡し後の受注ID, "::int"); done.push(`引渡し後の受注として受注ID ${v.引渡し後の受注ID} を関連付け`); }
  if (v.会員ID !== undefined) { o.set("customer_id", v.会員ID, "::int"); done.push(v.会員ID === null ? "会員との関連を外した（非会員）" : `注文者の会員を ${v.会員ID} に`); }
  if (v.店舗ID !== undefined) { o.set("base_info_id", v.店舗ID, "::int"); done.push(`店舗を店舗ID ${v.店舗ID} に`); }
  if (v.更新日 !== undefined) { o.日時("update_date", v.更新日); done.push(`更新日を ${v.更新日} に`); }
  if (o.sets.length > 0) {
    const id = o.p(受注ID);
    書く("受注の整え", 受注ID, `update dtb_order set ${o.sets.join(", ")} where id = ${id}::int`, o.params);
  }

  const s = new 組み立て();
  const sh = v.配送先;
  if (sh) {
    if (sh.住所1 !== undefined) { s.set("addr01", sh.住所1, "::text"); done.push(`配送先の住所1を ${sh.住所1} に`); }
    if (sh.住所2 !== undefined) { s.set("addr02", sh.住所2, "::text"); done.push(`配送先の住所2を ${sh.住所2} に`); }
    if (sh.姓 !== undefined) { s.set("name01", sh.姓, "::text"); done.push(`配送先の姓を ${sh.姓} に`); }
    if (sh.名 !== undefined) { s.set("name02", sh.名, "::text"); done.push(`配送先の名を ${sh.名} に`); }
    if (sh.会社名 !== undefined) { s.set("company_name", sh.会社名, "::text"); done.push(`配送先の会社名を ${sh.会社名} に`); }
    if (sh.配送方法ID !== undefined) { s.set("delivery_id", sh.配送方法ID, "::int"); done.push(`配送方法を配送方法ID ${sh.配送方法ID} に`); }
    if (sh.配送方法名 !== undefined) { s.set("delivery_name", sh.配送方法名, "::text"); }
  }
  if (v.店舗ID !== undefined) s.set("base_info_id", v.店舗ID, "::int");
  if (v.会員ID !== undefined) s.set("customer_id", v.会員ID, "::int");
  if (s.sets.length > 0) {
    const id = s.p(受注ID);
    書く("配送先の整え", 受注ID, `update dtb_shipping set ${s.sets.join(", ")} where order_id = ${id}::int`, s.params, 5);
  }

  const i = new 組み立て();
  if (v.明細の商品コード !== undefined) { i.set("product_code", v.明細の商品コード, "::text"); done.push(`受注明細の商品コードを ${v.明細の商品コード} に`); }
  if (v.店舗ID !== undefined) i.set("base_info_id", v.店舗ID, "::int");
  if (v.会員ID !== undefined) i.set("customer_id", v.会員ID, "::int");
  if (i.sets.length > 0) {
    const id = i.p(受注ID);
    書く("受注明細の整え", 受注ID, `update dtb_order_item set ${i.sets.join(", ")} where order_id = ${id}::int`, i.params, 30);
  }
  if (v.明細数 !== undefined && v.明細数 > 1) {
    for (let n = 1; n < v.明細数; n++) 明細を足す(受注ID);
    done.push(`受注明細を ${v.明細数} 件に`);
  }
  return done;
}

/** 受注の最初の明細を写して、明細を1件足す（受注明細ごとに数える確認用） */
export function 明細を足す(受注ID: string): void {
  const cols = 列("dtb_order_item", ["id"]);
  const list = cols.join(", ");
  const sel = cols.map((c) => `s.${c}`).join(", ");
  書く("受注明細を足す", 受注ID,
    `insert into dtb_order_item (${list}) select ${sel} from dtb_order_item s where s.order_id = $1::int
      and s.id = (select min(x.id) from dtb_order_item x where x.order_id = $1::int and x.product_code like $2)`,
    [受注ID, `%${印}%`], 1);
}

/**
 * 基の受注（画面で作った受注）を写して、印つきの受注を1件足す。注文番号は指定の値（11文字まで）。
 * 受注・配送先・明細の順に写す。新しい受注の受注IDを返す。
 */
export function 受注を複製する(基の受注ID: string, 注文番号: string): string {
  if (注文番号.length > 11) throw new Error(`注文番号は11文字まで（${注文番号}）`);
  const oc = 列("dtb_order", ["id", "pre_order_id", "order_number"]);
  const base = 受注の確かめ(基の受注ID);
  writeTestData({
    理由: "基の受注を写して受注を足す",
    sql: `insert into dtb_order (${oc.join(", ")}, order_number) select ${oc.map((c) => `s.${c}`).join(", ")}, $2::text from dtb_order s where s.id = $1::int`,
    params: [基の受注ID, 注文番号], ...base, 最大行数: 1,
  });
  const found = query(`select id from dtb_order where order_number = $1 and deleted_at is null order by id desc limit 1`, [注文番号]);
  if (found.length === 0) throw new Error(`写した受注（注文番号 ${注文番号}）が見つからない`);
  const 新 = String(found[0].id);

  const sc = 列("dtb_shipping", ["id", "order_id"]);
  writeTestData({
    理由: "基の受注の配送先を写す",
    sql: `insert into dtb_shipping (${sc.join(", ")}, order_id) select ${sc.map((c) => `s.${c}`).join(", ")}, $2::int from dtb_shipping s where s.order_id = $1::int`,
    params: [基の受注ID, 新], ...base, 最大行数: 5,
  });
  const ic = 列("dtb_order_item", ["id", "order_id", "shipping_id"]);
  writeTestData({
    理由: "基の受注の明細を写す",
    sql: `insert into dtb_order_item (${ic.join(", ")}, order_id, shipping_id) select ${ic.map((c) => `s.${c}`).join(", ")}, $2::int,
            case when s.shipping_id is null then null else (select sh.id from dtb_shipping sh where sh.order_id = $2::int order by sh.id limit 1) end
            from dtb_order_item s where s.order_id = $1::int`,
    params: [基の受注ID, 新], ...base, 最大行数: 30,
  });
  return 新;
}

/** 印つきの会員（基の会員が印つきの受注を持つ）を写して、印つきのメールアドレスの会員を足す。会員IDを返す */
export function 会員を複製する(基の会員ID: string, 新メール: string, 顧客グループID?: string): string {
  if (!新メール.includes(印)) throw new Error("写した会員のメールアドレスには実行の印を含める");
  const base = {
    対象の確かめ: `select c.id as 会員ID, i.product_code as 商品コード from dtb_customer c
                    join dtb_order o on o.customer_id = c.id join dtb_order_item i on i.order_id = o.id
                    where c.id = $1::int and i.product_code like $2 limit 1`,
    確かめのparams: [基の会員ID, `%${印}%`], 印,
  };
  const cc = 列("dtb_customer", ["id", "email", "secret_key"]);
  writeTestData({
    理由: "基の会員を写して会員を足す",
    sql: `insert into dtb_customer (${cc.join(", ")}, email, secret_key) select ${cc.map((c) => `s.${c}`).join(", ")}, $2::text,
            substr(md5(random()::text || clock_timestamp()::text), 1, 32) from dtb_customer s where s.id = $1::int`,
    params: [基の会員ID, 新メール], ...base, 最大行数: 1,
  });
  const found = query(`select id from dtb_customer where email = $1 order by id desc limit 1`, [新メール]);
  if (found.length === 0) throw new Error(`写した会員（${新メール}）が見つからない`);
  const 新 = String(found[0].id);
  const pc = 列("dtb_player", ["id", "customer_id", "email", "customer_group_id"]);
  writeTestData({
    理由: "基の会員のプレイヤー情報を写す",
    sql: `insert into dtb_player (${pc.join(", ")}, customer_id, email, customer_group_id) select ${pc.map((c) => `s.${c}`).join(", ")}, $2::int, $3::text,
            coalesce(nullif($4::text, '')::int, s.customer_group_id) from dtb_player s where s.customer_id = $1::int`,
    params: [基の会員ID, 新, 新メール, 顧客グループID ?? ""], ...base, 最大行数: 1,
  });
  return 新;
}

/** 印つきの受注を持つ会員の購入実績（購入回数・購入金額・初回・最終の購入日時）を指定の値にする */
export function 会員の購入実績を設定する(会員ID: string, v: { 購入回数: number; 購入金額: number; 初回購入日時: string | null; 最終購入日時: string | null }): void {
  const c = new 組み立て();
  c.set("buy_times", v.購入回数, "::numeric"); c.set("buy_total", v.購入金額, "::numeric");
  c.日時("first_buy_date", v.初回購入日時); c.日時("last_buy_date", v.最終購入日時);
  const id = c.p(会員ID);
  writeTestData({
    理由: "会員の購入実績を開始時の値にする",
    sql: `update dtb_customer set ${c.sets.join(", ")} where id = ${id}::int`, params: c.params,
    対象の確かめ: `select c.id as 会員ID, i.product_code as 商品コード from dtb_customer c
                    join dtb_order o on o.customer_id = c.id join dtb_order_item i on i.order_id = o.id
                    where c.id = $1::int and i.product_code like $2 limit 1`,
    確かめのparams: [会員ID, `%${印}%`], 印, 最大行数: 1,
  });
}

/** 会員の購入実績（読むだけ） */
export function 会員の購入実績(会員ID: string): { 購入回数: string | null; 購入金額: string | null; 初回購入日時: string | null; 最終購入日時: string | null } {
  const r = query(`select buy_times::text as a, buy_total::text as b, to_char(first_buy_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as c, to_char(last_buy_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as d from dtb_customer where id = $1::int`, [会員ID])[0];
  if (!r) throw new Error(`会員ID ${会員ID} の会員が無い`);
  return { 購入回数: r.a, 購入金額: r.b, 初回購入日時: r.c, 最終購入日時: r.d };
}

/** 受注の削除済み区分（削除日時。読むだけ） */
export function 受注の削除日時(受注ID: string): string | null {
  const r = query(`select deleted_at::text as d from dtb_order where id = $1::int`, [受注ID])[0];
  if (!r) throw new Error(`受注ID ${受注ID} の受注が無い`);
  return r.d;
}

/** 店名の店舗ID（読むだけ。同じ店名が複数あれば最新） */
export function 店舗ID(店名: string): string {
  const r = query(`select id from dtb_base_info where shop_name = $1 order by id desc limit 1`, [店名]);
  if (r.length === 0) throw new Error(`店舗「${店名}」が無い`);
  return String(r[0].id);
}

/** 店舗が開店か（読むだけ） */
export function 開店か(店舗ID: string): boolean {
  return query(`select is_open_shop from dtb_base_info where id = $1::int`, [店舗ID])[0]?.is_open_shop === "true";
}

/**
 * 閉店の店舗にする。対象は、印つきの受注を配送先に持つ店舗だけ（そうでない店舗には書かない）。
 * 試験用の店舗（シードが店舗登録画面で作った）に、印つきの受注を割り当てたあとに呼ぶ。
 */
export function 店舗を閉店にする(店舗ID: string): void {
  writeTestData({
    理由: "試験用の店舗を閉店にする",
    sql: `update dtb_base_info set is_open_shop = false where id = $1::int`, params: [店舗ID],
    対象の確かめ: `select b.id as 店舗ID, i.product_code as 商品コード from dtb_base_info b
                    join dtb_shipping s on s.base_info_id = b.id join dtb_order_item i on i.order_id = s.order_id
                    where b.id = $1::int and i.product_code like $2 limit 1`,
    確かめのparams: [店舗ID, `%${印}%`], 印, 最大行数: 1,
  });
}

/** 顧客グループとして使う既存の3件（IDの小さい順。読むだけ） */
export function 顧客グループ(件数: number): { id: string; 名前: string }[] {
  const r = query(`select id, name from dtb_customer_group order by id limit ${Math.floor(件数)}`);
  return r.map((x) => ({ id: String(x.id), 名前: String(x.name) }));
}

/** 配送方法として使う既存の n 件（IDの小さい順。読むだけ） */
export function 配送方法(件数: number): { id: string; 名前: string }[] {
  const r = query(`select id, name from dtb_delivery where visible order by id limit ${Math.floor(件数)}`);
  return r.map((x) => ({ id: String(x.id), 名前: String(x.name) }));
}

/** 名前が一致する受注一覧の検索パターンを消す（名前に印を含むものだけ） */
export function 検索パターンを消す(名前: string): number {
  return writeTestData({
    理由: "印つきの検索パターンを消す",
    sql: `delete from dtb_search_pattern where name = $1::text and display_key = 'order'`, params: [名前],
    対象の確かめ: `select sp.id as 検索パターンID, sp.name as 名前 from dtb_search_pattern sp where sp.name = $1 and sp.display_key = 'order'`,
    確かめのparams: [名前], 印, 最大行数: 3,
  });
}

/** 名前の受注一覧の検索パターンの件数（読むだけ） */
export function 検索パターンの件数(名前: string): number {
  return query(`select id from dtb_search_pattern where name = $1 and display_key = 'order'`, [名前]).length;
}

/** 注文番号を書き換える（手順の中で、受注を新しく登録するのに代えて使う）。印つきの受注だけ */
export function 注文番号を書き換える(受注ID: string, 注文番号: string): void {
  受注を整える(受注ID, { 注文番号 });
}

/** 受注の注文番号（読むだけ） */
export function 受注の注文番号(受注ID: string): string {
  const r = query(`select order_number from dtb_order where id = $1::int`, [受注ID]);
  if (r.length === 0) throw new Error(`受注ID ${受注ID} が無い`);
  return String(r[0].order_number);
}

/** 注文番号から受注ID（読むだけ。削除済みも含めて最新） */
export function 受注ID(注文番号: string): string {
  const r = query(`select id from dtb_order where order_number = $1 order by id desc limit 1`, [注文番号]);
  if (r.length === 0) throw new Error(`注文番号「${注文番号}」の受注が無い`);
  return String(r[0].id);
}

/** 配送方法の名前 → 配送方法ID（読むだけ。無ければ null） */
export function 配送方法ID(名前: string): string | null {
  const r = query(`select id from dtb_delivery where name = $1 order by id limit 1`, [名前]);
  return r.length === 0 ? null : String(r[0].id);
}

/** 受注の記録（対応状況・更新日時・削除日時。読むだけ） */
export function 受注の記録(受注ID: string): { 対応状況: string; 更新日時: string; 削除日時: string | null } {
  const r = query(`select s.name as a, to_char(o.update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as b, o.deleted_at::text as c from dtb_order o left join mtb_order_status s on s.id = o.order_status_id where o.id = $1::int`, [受注ID])[0];
  if (!r) throw new Error(`受注ID ${受注ID} の受注が無い`);
  return { 対応状況: String(r.a), 更新日時: String(r.b), 削除日時: r.c };
}
