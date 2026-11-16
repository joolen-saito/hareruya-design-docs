/**
 * M06-01 買取一覧のシード・確かめのための DB 操作。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 読む（棚戻し済みか・買取の内部IDなど）は lib/db.ts の query（参照だけ）。
 * 書くのは、画面で作れない値だけ。依頼者の承認 2026-11-10「印つきデータは何でも」に従い、
 * E2E が画面（フロントの店頭買取査定申込）で作った「実行の印つき」の買取（申込者の姓に実行の印）と、
 * その買取に紐づく行（明細・実在庫・ステータス変更履歴）にだけ、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） で書く。
 * 共有のマスタ・メンバー・設定は書き換えない（メンバー・本人確認の種類・商品は、既にある行を指すだけ）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

/** 書き込みの印。申込者の姓に付けた実行の印 */
const 印 = RUN_MARK;

/** 親の買取の確かめ。姓に実行の印がある行だけを返す */
const 親の確かめ = "select o.id, o.last_name from dtb_otc_buy_order o where o.id = $1::int";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

/** 査定ID → 店頭買取受注ID（内部ID）。1件でなければ止める */
/** この実行で申し込んだ買取の、査定ID → 申込者の姓（同じ査定IDの買取が2件以上あるときに、E2E の1件を選ぶため） */
const 申込者の姓 = new Map<string, string>();

/** この実行で申し込んだ買取の査定IDと申込者の姓を覚える（申し込んだ直後に呼ぶ） */
export function 申込者を覚える(査定ID: string, 姓: string): void {
  申込者の姓.set(査定ID, 姓);
}

/** 覚えた申込者の姓（覚えていなければ null） */
export function 覚えた申込者の姓(査定ID: string): string | null {
  return 申込者の姓.get(査定ID) ?? null;
}

/**
 * 査定IDは、アプリが「その日・その店舗の査定申込の件数＋1」で振る。E2E が査定申込日時を DB で過去へ移すと、その日の件数が減り、
 * あとの申込に同じ査定IDが振られることがある（2026-11-14 の 022: 査定ID 20261114-368-0007 が2件）。
 * 同じ査定IDが2件以上あるときは、申し込んだときに覚えた申込者の姓（無ければこの実行の印を姓に持つもの）の1件を選ぶ。1件に決まらなければ止める。
 */
export function 受注IDを調べる(査定ID: string): string {
  const r = query("select id, last_name from dtb_otc_buy_order where assessment_id = $1", [査定ID]);
  if (r.length === 1) return String(r[0].id);
  const 姓 = 申込者の姓.get(査定ID);
  const mine = r.filter((x) => (姓 ? String(x.last_name ?? "") === 姓 : String(x.last_name ?? "").includes(印)));
  if (r.length > 1 && mine.length === 1) return String(mine[0].id);
  throw new Error(`査定ID ${査定ID} の買取が ${r.length} 件（1件のはず）。うちこの実行の印つきの申込者の買取は ${mine.length} 件`);
}

/** 棚戻し済みフラグ（真なら棚戻し済み） */
export function 棚戻し済みか(査定ID: string): boolean {
  const r = query("select restocked_flg as f from dtb_otc_buy_order where id = $1::int", [数字(受注IDを調べる(査定ID))]);
  if (r.length !== 1) throw new Error(`査定ID ${査定ID} の買取が ${r.length} 件（1件のはず）`);
  return r[0].f === "true" || r[0].f === "t";
}

/** 同じ名前のメンバーの内部ID（1人でなければ止める。メンバーは変えない） */
function メンバーID(名前: string): string {
  const r = query("select id from dtb_member where name = $1", [名前]);
  if (r.length !== 1) throw new Error(`メンバー「${名前}」が ${r.length} 人（1人のはず）`);
  return String(r[0].id);
}

/** 印つきの買取の最終更新者（買取の担当者）を、既存のメンバーに設定する */
export function 最終更新者を設定する(査定ID: string, 管理者名: string): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の最終更新者を、既存のメンバー「${管理者名}」にする`,
    sql: "update dtb_otc_buy_order set member_id = $2::int where id = $1::int",
    params: [数字(id), 数字(メンバーID(管理者名))],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "最終更新者の設定");
}

/** 印つきの買取に、ステータス変更履歴（買取成立など）を、既存のメンバーの変更として、指定の日数前の日時で1件足す */
export function ステータス変更履歴を足す(査定ID: string, 状態の番号: number, 管理者名: string, 日数前: number): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} に、ステータス（番号${状態の番号}）の変更履歴（変更者「${管理者名}」・${日数前}日前）を足す`,
    sql: `insert into dtb_otc_buy_order_status_history (otc_buy_order_id, otc_buy_order_status_id, member_id, create_date)
          select o.id, $2::int, $3::int, now() - ($4::int * interval '1 day') from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(id), 状態の番号, 数字(メンバーID(管理者名)), 日数前],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "ステータス変更履歴");
}

/** 印つきの買取の申込者名と買取金額（査定合計金額）を設定する。最後の書き込みにする（姓から実行の印が消えるため） */
export function 申込者名と買取金額を設定する(査定ID: string, 姓: string, 名: string, 金額: number): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の申込者を「${姓} ${名}」、買取金額を ${金額} にする`,
    sql: "update dtb_otc_buy_order set last_name = $2, first_name = $3, total_price = $4::int where id = $1::int",
    params: [数字(id), 姓, 名, 金額],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "申込者名・買取金額の設定");
}

/** 印つきの買取の住所3を設定する */
export function 住所3を設定する(査定ID: string, 住所3: string): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の住所3を「${住所3}」にする`,
    sql: "update dtb_otc_buy_order set addr03 = $2 where id = $1::int",
    params: [数字(id), 住所3],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "住所3の設定");
}

/** 印つきの買取に、本人確認の種類（既存のマスタの先頭）を設定する（古物台帳に身分証が出る） */
export function 本人確認を設定する(査定ID: string): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} に本人確認の種類（既存のマスタの先頭）を設定する`,
    sql: "update dtb_otc_buy_order set identification_id = (select min(i.id) from mtb_identification i) where id = $1::int",
    params: [数字(id)],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "本人確認の設定");
}

/** 印つきの買取の棚戻し済みフラグを「棚戻し済み」にする */
export function 棚戻し済みにする(査定ID: string): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} を棚戻し済みにする`,
    sql: "update dtb_otc_buy_order set restocked_flg = true where id = $1::int",
    params: [数字(id)],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "棚戻し済みの設定");
}

/** 印つきの買取の姓を設定する（検索に当たらなくする） */
export function 姓を設定する(査定ID: string, 姓: string): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の姓を「${姓}」にする`,
    sql: "update dtb_otc_buy_order set last_name = $2 where id = $1::int",
    params: [数字(id), 姓],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "姓の設定");
}

function 規格を確かめる(商品コード: string): void {
  const n = Number(query("select count(*) as n from dtb_product_class where product_code = $1", [商品コード])[0].n);
  if (n !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${n} 件（1件のはず）`);
}

/** 印つきの買取に、買取明細（印つきの商品コードの商品）を1件足す。数量は査定時の個数 */
export function 買取明細を足す(査定ID: string, 商品コード: string, 数量: number, 買取金額: number): void {
  規格を確かめる(商品コード);
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} に買取明細（商品 ${商品コード}・数量${数量}・買取金額${買取金額}）を足す`,
    sql: `insert into dtb_otc_buy_order_detail (otc_buy_order_id, product_class_id, price, sell_price, original_quantity)
          select o.id, pc.id, $3::int, $3::int, $4::int from dtb_otc_buy_order o join dtb_product_class pc on pc.product_code = $2 where o.id = $1::int`,
    params: [数字(id), 商品コード, 買取金額, 数量],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "買取明細");
}

/** 印つきの買取に、実在庫情報（印つきの商品コードの商品）を1件足す */
export function 実在庫を足す(査定ID: string, 商品コード: string, 数量: number, 小計: number): void {
  規格を確かめる(商品コード);
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} に実在庫情報（商品 ${商品コード}・数量${数量}・小計${小計}）を足す`,
    sql: `insert into dtb_otc_buy_order_stock (otc_buy_order_id, product_class_id, quantity, subtotal)
          select o.id, pc.id, $3::int, $4::int from dtb_otc_buy_order o join dtb_product_class pc on pc.product_code = $2 where o.id = $1::int`,
    params: [数字(id), 商品コード, 数量, 小計],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "実在庫情報");
}

// ---- 日時の設定（2026-11-12 に足した。020・022 が使う。実行の印つきの買取にだけ書く） ----

/** 日時の文字列（「2026-08-15 00:00」の形。日本時間）を確かめる */
function 日時(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) throw new Error(`日時の形が違う（${s}）`);
  return `${s}:00+09`;
}

/** 印つきの買取の査定申込日時を設定する（日本時間） */
export function 査定申込日時を設定する(査定ID: string, 日時の文字列: string): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の査定申込日時を ${日時の文字列} にする`,
    sql: "update dtb_otc_buy_order set apply_date = $2::timestamptz where id = $1::int",
    params: [数字(id), 日時(日時の文字列)],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "査定申込日時の設定");
}

/** 印つきの買取の買取成立日時を設定する（日本時間） */
export function 買取成立日時を設定する(査定ID: string, 日時の文字列: string): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の買取成立日時を ${日時の文字列} にする`,
    sql: "update dtb_otc_buy_order set complete_date = $2::timestamptz where id = $1::int",
    params: [数字(id), 日時(日時の文字列)],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "買取成立日時の設定");
}

/** 印つきの買取の買取キャンセル日時を設定する（日本時間） */
export function 買取キャンセル日時を設定する(査定ID: string, 日時の文字列: string): void {
  const id = 受注IDを調べる(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の買取キャンセル日時を ${日時の文字列} にする`,
    sql: "update dtb_otc_buy_order set cancel_date = $2::timestamptz where id = $1::int",
    params: [数字(id), 日時(日時の文字列)],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "買取キャンセル日時の設定");
}

/**
 * 査定申込日時が範囲（日本時間・両端を含む）にある買取のうち、指定の査定IDの買取（この実行で作ったもの）以外（参照だけ。ほかの方の買取は消さない）。
 * 同じ査定IDがほかの買取にも振られていることがあるので、除くのは内部IDで決める。止めるときの判断の材料に、査定IDと申込者の姓を返す。
 */
export function ほかの買取の査定申込(から: string, まで: string, 除く査定ID: string[]): { 査定ID: string; 姓: string }[] {
  const ids = 除く査定ID.map((x) => 数字(受注IDを調べる(x)));
  const r = query(`select assessment_id, last_name from dtb_otc_buy_order where apply_date >= $1::timestamptz and apply_date <= $2::timestamptz
      and not (id = any(string_to_array($3, ',')::int[])) order by id`, [日時(から), 日時(まで), ids.join(",")]);
  return r.map((x) => ({ 査定ID: String(x.assessment_id ?? ""), 姓: String(x.last_name ?? "") }));
}

/** 査定申込日時が範囲にある買取のうち、指定の査定IDの買取以外の件数（参照だけ） */
export function ほかの買取の査定申込の数(から: string, まで: string, 除く査定ID: string[]): number {
  return ほかの買取の査定申込(から, まで, 除く査定ID).length;
}

/** 買取のステータスの名前（確かめ用。参照だけ） */
export function 買取のステータス名(査定ID: string): string {
  const r = query(`select s.name from dtb_otc_buy_order o left join mtb_otc_buy_order_status s on s.id = o.otc_buy_order_status_id where o.id = $1::int`, [数字(受注IDを調べる(査定ID))]);
  if (r.length !== 1) throw new Error(`査定ID ${査定ID} の買取が ${r.length} 件（1件のはず）`);
  return String(r[0].name ?? "");
}

/** 印つきの買取のステータスを、名前で指定したステータスにする（画面の操作で止められないときだけ使う） */
export function ステータスを設定する(査定ID: string, 名前: string): void {
  const id = 受注IDを調べる(査定ID);
  const s = query("select id from mtb_otc_buy_order_status where name = $1", [名前]);
  if (s.length !== 1) throw new Error(`買取のステータス「${名前}」が ${s.length} 件（1件のはず）`);
  一件(writeTestData({
    理由: `買取 ${査定ID} のステータスを「${名前}」にする`,
    sql: "update dtb_otc_buy_order set otc_buy_order_status_id = $2::int where id = $1::int",
    params: [数字(id), 数字(String(s[0].id))],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "ステータスの設定");
}

/** 買取金額が範囲（両端を含む）にある買取のうち、指定の査定ID以外の件数（参照だけ） */
export function ほかの買取の買取金額の数(から: number, まで: number, 除く査定ID: string): number {
  return Number(query("select count(*) as n from dtb_otc_buy_order where total_price between $1::int and $2::int and coalesce(assessment_id, '') <> $3", [から, まで, 除く査定ID])[0].n);
}
