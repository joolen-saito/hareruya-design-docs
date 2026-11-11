/**
 * M08-01 会員検索一覧のシード・手順が、画面で作った「実行の印つき」の会員を整えるための DB 書き込み。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換える・親にする会員は、メールアドレスに実行の印を含む会員だけ（対象の確かめの SELECT が返す行がどれも印を含む。含まなければ書かずに止まる）。
 *  - 追加する行（受注・買取・会員の複製・検索パターン）の親は、印つきの会員（検索パターンは印つきの名前の会員一覧用パターン）。
 *  - マスタ・設定・ほかの人のデータには書かない。物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 *
 * 書く理由（画面だけでは作れないもの）:
 *  - 登録日・更新日・最終購入日・購入金額と回数・スマレジ購入金額と回数は、画面で入力できない（システムが振る・購入の結果で決まる）。
 *  - 購入商品・買取総額と件数は、受注・買取の明細から集計される。管理画面に受注・買取を新規登録する画面が無く、フロントの注文は共有の商品の在庫を減らすので、行を足す。
 *  - 同じ形の会員を10〜50人作るのは、フロントの会員登録を人数分流すと時間がかかるため、印つきの1人目を写す。
 *  - 画面の削除の操作より先に削除済みにする（手順で「DBで削除フラグを有効にする」と定めるもの）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";
import { 日本時間 } from "./m05_01_order_write";

type Sql値 = string | number;

/** 会員が、メールアドレスに実行の印を持つことを確かめる SELECT */
function 会員の確かめ(会員ID: string): { 対象の確かめ: string; 確かめのparams: Sql値[]; 印: string } {
  return {
    対象の確かめ: `select c.id as 会員ID, c.email as メール from dtb_customer c where c.id = $1::int and c.email like $2`,
    確かめのparams: [会員ID, `%${RUN_MARK}%`],
    印: RUN_MARK,
  };
}

/** 表の列名（除く列を除く）を、information_schema から読む（参照だけ） */
function 列(表: string, 除く: string[]): string[] {
  const rows = query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position`, [表]);
  const cols = rows.map((r) => String(r.column_name)).filter((c) => !除く.includes(c));
  if (cols.length === 0) throw new Error(`表 ${表} の列を読めない`);
  return cols;
}

export type 会員の値 = {
  /** 「1990-06-15」 */
  生年月日?: string;
  /** 日本時間の「2026-01-15 10:00」 */
  登録日?: string; 更新日?: string; 最終購入日?: string;
  EC購入金額?: number; EC購入回数?: number; スマレジ購入金額?: number; スマレジ購入回数?: number;
};

/** 印つきの会員の、日付と購入実績を指定の値にする（書き換えた内容の短い説明を返す） */
export function 会員の値を設定する(会員ID: string, v: 会員の値): string[] {
  const sets: string[] = [];
  const params: Sql値[] = [];
  const done: string[] = [];
  const p = (x: Sql値): string => { params.push(x); return `$${params.length}`; };
  if (v.生年月日 !== undefined) { sets.push(`birth = ${p(v.生年月日)}::date`); done.push(`生年月日を ${v.生年月日} に`); }
  if (v.登録日 !== undefined) { sets.push(`create_date = ${p(日本時間(v.登録日))}::timestamptz`); done.push(`登録日を ${v.登録日} に`); }
  if (v.更新日 !== undefined) { sets.push(`update_date = ${p(日本時間(v.更新日))}::timestamptz`); done.push(`更新日を ${v.更新日} に`); }
  if (v.最終購入日 !== undefined) { sets.push(`last_buy_date = ${p(日本時間(v.最終購入日))}::timestamptz`); done.push(`最終購入日を ${v.最終購入日} に`); }
  if (v.EC購入金額 !== undefined) { sets.push(`buy_total = ${p(v.EC購入金額)}::numeric`); done.push(`EC購入金額を ${v.EC購入金額} に`); }
  if (v.EC購入回数 !== undefined) { sets.push(`buy_times = ${p(v.EC購入回数)}::numeric`); done.push(`EC購入回数を ${v.EC購入回数} に`); }
  if (v.スマレジ購入金額 !== undefined) { sets.push(`smaregi_buy_total = ${p(v.スマレジ購入金額)}::numeric`); done.push(`スマレジ購入金額を ${v.スマレジ購入金額} に`); }
  if (v.スマレジ購入回数 !== undefined) { sets.push(`smaregi_buy_times = ${p(v.スマレジ購入回数)}::numeric`); done.push(`スマレジ購入回数を ${v.スマレジ購入回数} に`); }
  if (sets.length === 0) return [];
  const id = p(会員ID);
  writeTestData({ 理由: "会員の日付・購入実績を開始時の値にする", sql: `update dtb_customer set ${sets.join(", ")} where id = ${id}::int`, params, ...会員の確かめ(会員ID), 最大行数: 1 });
  return done;
}

/** 印つきの会員の購入（受注と明細1件）を足す。購入商品名・コードで検索できるようにする */
export function 購入を足す(会員ID: string, 商品名: string, 商品コード: string): void {
  const base = 会員の確かめ(会員ID);
  writeTestData({
    理由: "印つきの会員の受注を1件足す（購入商品名・コードの検索の元。受注の新規登録の画面が無い）",
    // 対応状況は新規受付（1）。仮受注・処理中は購入商品の検索から外れるので使わない
    sql: `insert into dtb_order (customer_id, base_info_id, name01, name02, order_status_id, create_date, update_date, order_date)
          select c.id, (select min(id) from dtb_base_info), c.name01, c.name02, 1, now(), now(), now() from dtb_customer c where c.id = $1::int`,
    params: [会員ID], ...base, 最大行数: 1,
  });
  const found = query(`select max(o.id) as id from dtb_order o where o.customer_id = $1::int`, [会員ID]);
  const 受注ID = found[0]?.id;
  if (!受注ID) throw new Error(`足した受注が見つからない（会員ID ${会員ID}）`);
  writeTestData({
    理由: "足した受注の明細を1件足す（購入商品名・コード）",
    sql: `insert into dtb_order_item (order_id, product_name, product_code, price, quantity, tax, tax_rate, tax_adjust, order_item_type_id)
          select o.id, $2::text, $3::text, 100, 1, 0, 10, 0, 1 from dtb_order o where o.id = $1::int`,
    params: [受注ID, 商品名, 商品コード],
    対象の確かめ: `select o.id as 受注ID, c.email as メール from dtb_order o join dtb_customer c on c.id = o.customer_id where o.id = $1::int and c.email like $2`,
    確かめのparams: [受注ID, `%${RUN_MARK}%`], 印: RUN_MARK, 最大行数: 1,
  });
}

/** 印つきの会員の買取（1件の買取に1枚）を足す。買取総額＝査定金額×枚数、買取件数＝買取の数 */
export function 買取を足す(会員ID: string, 金額: number): void {
  const base = 会員の確かめ(会員ID);
  writeTestData({
    理由: "印つきの会員の買取を1件足す（買取総額・買取件数の検索の元。買取の新規登録の画面が無い）",
    sql: `insert into dtb_buy_order (customer_id, buy_order_status_id, last_name, first_name, last_name_kana, first_name_kana, email, addr01, addr02, zipcode,
                                     delivery_fee, auto_approval_flg, order_date, update_date, can_transfer_request_flg, transfer_failed_flg, qualified_invoice_issuer_flg, restocked_flg)
          select c.id, (select min(id) from mtb_buy_order_status), '検索確認', '買取', 'ケンサクカクニン', 'カイトリ', c.email, '旧住所1', '旧住所2', '1000001',
                 0, false, now(), now(), false, false, false, false from dtb_customer c where c.id = $1::int`,
    params: [会員ID], ...base, 最大行数: 1,
  });
  const found = query(`select max(b.id) as id from dtb_buy_order b where b.customer_id = $1::int`, [会員ID]);
  const 買取ID = found[0]?.id;
  if (!買取ID) throw new Error(`足した買取が見つからない（会員ID ${会員ID}）`);
  writeTestData({
    理由: "足した買取の代表カードを1枚足す（査定金額）。商品は既存の商品を参照するだけで書き換えない",
    sql: `insert into dtb_buy_main_card (buy_order_id, product_id, count, price, sale_flg, purchase_category)
          select b.id, (select min(id) from dtb_product), 1, $2::int, true, 1 from dtb_buy_order b where b.id = $1::int`,
    params: [買取ID, 金額],
    対象の確かめ: `select b.id as 買取ID, c.email as メール from dtb_buy_order b join dtb_customer c on c.id = b.customer_id where b.id = $1::int and c.email like $2`,
    確かめのparams: [買取ID, `%${RUN_MARK}%`], 印: RUN_MARK, 最大行数: 1,
  });
}

/** 印つきの会員（本会員）を写して、印つきのメールアドレスの会員を足す。会員IDを返す */
export function 会員を写す(基の会員ID: string, 新メール: string): string {
  if (!新メール.includes(RUN_MARK)) throw new Error("写した会員のメールアドレスには実行の印を含める");
  const base = 会員の確かめ(基の会員ID);
  const cc = 列("dtb_customer", ["id", "email", "secret_key"]);
  writeTestData({
    理由: "印つきの会員を写して会員を足す",
    sql: `insert into dtb_customer (${cc.join(", ")}, email, secret_key) select ${cc.map((c) => `s.${c}`).join(", ")}, $2::text,
            substr(md5(random()::text || clock_timestamp()::text), 1, 32) from dtb_customer s where s.id = $1::int`,
    params: [基の会員ID, 新メール], ...base, 最大行数: 1,
  });
  const found = query(`select id from dtb_customer where email = $1 order by id desc limit 1`, [新メール]);
  if (found.length === 0) throw new Error(`写した会員（${新メール}）が見つからない`);
  const 新 = String(found[0].id);
  const pc = 列("dtb_player", ["id", "customer_id", "email"]);
  writeTestData({
    理由: "印つきの会員のプレイヤー情報を写す",
    sql: `insert into dtb_player (${pc.join(", ")}, customer_id, email) select ${pc.map((c) => `s.${c}`).join(", ")}, $2::int, $3::text from dtb_player s where s.customer_id = $1::int`,
    params: [基の会員ID, 新, 新メール], ...base, 最大行数: 1,
  });
  return 新;
}

/** 検索語（メールアドレスに含む）に合う印つきの会員の登録日時を、会員ID順に1分間隔にする（先頭は基準の日時の1分後） */
export function 登録日時を1分間隔にする(検索語: string, 基準: string): number {
  if (!検索語.includes(RUN_MARK)) throw new Error("検索語には実行の印を含める");
  return writeTestData({
    理由: "会員の登録日時を会員ID順に1分間隔にする",
    sql: `update dtb_customer c set create_date = $1::timestamptz + (s.n * interval '1 minute')
            from (select id, row_number() over (order by id) as n from dtb_customer where email like $2) s where c.id = s.id`,
    params: [日本時間(基準), `%${検索語}%`],
    対象の確かめ: `select c.id as 会員ID, c.email as メール from dtb_customer c where c.email like $1`,
    確かめのparams: [`%${検索語}%`], 印: RUN_MARK, 最大行数: 60,
  });
}

/** 印つきの会員を削除済みにする（画面の削除の操作と同じ結果。手順の「DBで削除フラグを有効にする」） */
export function 会員を削除済みにする(会員ID: string): void {
  writeTestData({ 理由: "会員の削除フラグを有効にする", sql: `update dtb_customer set del_flg = 1 where id = $1::int`, params: [会員ID], ...会員の確かめ(会員ID), 最大行数: 1 });
}

/** 印つきの会員一覧用の検索パターンを写して、同じ名前の別の表示（商品一覧用）の検索パターンを足す */
export function 商品一覧用の検索パターンを足す(基の名前: string, 新しい名前: string): void {
  if (!基の名前.includes(RUN_MARK) || !新しい名前.includes(RUN_MARK)) throw new Error("検索パターンの名前には実行の印を含める");
  const cols = 列("dtb_search_pattern", ["id", "name", "display_key"]);
  writeTestData({
    理由: "商品一覧用の検索パターンを足す（会員一覧に出ないことの確認用。商品一覧の画面に検索パターンの保存が無い）",
    sql: `insert into dtb_search_pattern (${cols.join(", ")}, name, display_key) select ${cols.map((c) => `s.${c}`).join(", ")}, $2::text, 'product'
            from dtb_search_pattern s where s.name = $1 and s.display_key = 'customer'`,
    params: [基の名前, 新しい名前],
    対象の確かめ: `select s.id as 検索パターンID, s.name as 名前 from dtb_search_pattern s where s.name = $1 and s.display_key = 'customer'`,
    確かめのparams: [基の名前], 印: RUN_MARK, 最大行数: 1,
  });
}
