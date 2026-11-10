/**
 * M05-21 ピッキングリスト印刷の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。呼ぶ側には業務の言葉の関数名で見せる。
 * 書き足すのは、画面で作った E2E の行（試験用会員の受注・その受注だけの出荷指示リスト）の、画面で作れない状態（出荷指示リストの作成日・受注の対応状況「対応中」）だけ。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

/** 受注一覧しきい値の金額1・金額2（共有の設定。書き換えない） */
export function 受注一覧しきい値(): { 金額1: string; 金額2: string } {
  const rows = query(`select option_key, option_value from mtb_option where option_key in ('order_list_threshold_price_1', 'order_list_threshold_price_2')`);
  const v = (k: string) => String(rows.find((r) => r.option_key === k)?.option_value ?? "");
  return { 金額1: v("order_list_threshold_price_1"), 金額2: v("order_list_threshold_price_2") };
}

/** レアリティの日本語名に対応するコード（マスタ。書き換えない） */
export function レアリティのコード(名前: string): string {
  const r = query(`select code from mtb_rarity where name_jp = $1`, [名前]);
  return r.length === 1 ? String(r[0].code ?? "") : "";
}

/** 色の日本語名が登録されているか（マスタ。書き換えない） */
export function 色があるか(名前: string): boolean {
  return query(`select 1 from mtb_color where name_jp = $1`, [名前]).length === 1;
}

/** 予約グッズの親カテゴリ（アプリの決め打ちの番号 4）の下の、最初のカテゴリの番号 */
export function 予約グッズの子カテゴリ(): string {
  const r = query(`select id from dtb_category where parent_category_id = 4 order by sort_no desc, id limit 1`);
  if (r.length !== 1) throw new Error("予約グッズの親カテゴリ（番号4）の下にカテゴリが無い");
  return String(r[0].id);
}

/** 試験用会員（メールアドレス）の受注で、注文番号が当たるものの受注ID */
export function 受注IDの(注文番号: string, メール: string): string {
  const r = query(`select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where o.order_number = $1 and c.email = $2`, [注文番号, メール]);
  if (r.length !== 1) throw new Error(`注文番号「${注文番号}」・会員「${メール}」の受注が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/**
 * 注文番号の範囲（数値で from〜to）に入る受注の番号の一覧。出荷指示リスト生成は、範囲に入るほかの方の受注も集めるので、
 * 生成の前に、範囲に入るのが E2E の受注だけかを確かめるのに使う（購入処理中・キャンセルも数える。数を多めに見て止まる側へ倒す）。
 */
export function 注文番号の範囲の受注(from: string, to: string): { 受注ID: string; 注文番号: string; メール: string }[] {
  return query(
    `select o.id, o.order_number, c.email from dtb_order o left join dtb_customer c on c.id = o.customer_id
      where o.order_number ~ '^[0-9]+$' and o.order_number::numeric between $1::numeric and $2::numeric
      order by o.order_number`,
    [from, to],
  ).map((r) => ({ 受注ID: String(r.id), 注文番号: String(r.order_number), メール: String(r.email ?? "") }));
}

/** 受注が入っている出荷指示リストの番号（無ければ空） */
export function 受注の出荷指示リスト(受注ID: string): string[] {
  return query(`select standby_id from dtb_order_shipping_standby where order_id = $1 order by standby_id`, [受注ID]).map((r) => String(r.standby_id));
}

/** 出荷指示リストに入っている受注ID */
export function 出荷指示リストの受注(出荷指示リストID: string): string[] {
  return query(`select order_id from dtb_order_shipping_standby where standby_id = $1 order by order_id`, [出荷指示リストID]).map((r) => String(r.order_id));
}

/** 受注の対応状況の名前 */
export function 受注の対応状況(受注ID: string): string {
  const r = query(`select s.name from dtb_order o join mtb_order_status s on s.id = o.order_status_id where o.id = $1`, [受注ID]);
  return r.length === 1 ? String(r[0].name) : "";
}

/** 出荷指示リストの作成日（表示の形 YYYY/MM/DD HH:MM:SS。日本時間） */
export function 出荷指示リストの作成日(出荷指示リストID: string): string {
  const r = query(`select to_char(create_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI:SS') as d from dtb_shipping_standby where id = $1`, [出荷指示リストID]);
  return r.length === 1 ? String(r[0].d ?? "") : "";
}

// ---- 書き足し（E2E の行だけ） ----

/** 出荷指示リストのうち、入っている受注がすべて試験用会員（メールアドレス）のもの */
function 出荷指示リストの持ち主(出荷指示リストID: string, メール: string): Owner {
  return {
    sql: `select ss.id from dtb_shipping_standby ss
           where ss.id = $1
             and exists (select 1 from dtb_order_shipping_standby x where x.standby_id = ss.id)
             and not exists (select 1 from dtb_order_shipping_standby x join dtb_order o on o.id = x.order_id
                              left join dtb_customer c on c.id = o.customer_id
                              where x.standby_id = ss.id and coalesce(c.email, '') <> $2)`,
    params: [出荷指示リストID, メール],
  };
}
/** 試験用会員（メールアドレス）の受注 */
function 受注の持ち主(受注IDs: string[], メール: string): Owner {
  return { sql: `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where o.id = any($1::int[]) and c.email = $2`, params: [`{${受注IDs.join(",")}}`, メール] };
}

/** 出荷指示リストの作成日を指定の日時（日本時間）にする（画面では、生成した日時になる） */
export function 出荷指示リストの作成日を書き足す(what: string, 出荷指示リストID: string, メール: string, 日時: string): void {
  updateOwnRows(what, { table: "dtb_shipping_standby", key: "id", ids: [出荷指示リストID], set: { create_date: `${日時}+09:00` }, owner: 出荷指示リストの持ち主(出荷指示リストID, メール) });
}

/** 受注の対応状況を「対応中」にする（画面の受注情報編集の対応状況の選択肢に「対応中」が無い） */
export function 受注を対応中にする(what: string, 受注IDs: string[], メール: string): void {
  const r = query(`select id from mtb_order_status where name = '対応中'`);
  if (r.length !== 1) throw new Error(`${what}: 対応状況「対応中」がマスタに無い`);
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: 受注IDs, set: { order_status_id: Number(r[0].id) }, owner: 受注の持ち主(受注IDs, メール) });
}
