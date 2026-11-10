/**
 * M03-30 基準価格変更CSV登録の続き（-x）の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。呼ぶ側には業務の言葉の関数名で見せる。
 * 書き足すのは、画面（グッズ商品CSV登録・商品規格の登録）で作った E2E の商品・商品規格の、画面で作れない状態（販売価格・価格履歴の0件・廃止）だけ。
 * 持ち主の確かめは「商品コード（実行の印つき）が当たる商品規格」。
 */
import { query } from "../lib/db";
import { deleteOwnRows, Owner, updateOwnRows } from "../lib/db_write";

/** 商品コード（実行の印つき）が当たる商品規格 */
function 規格の持ち主(商品コード: string[]): Owner {
  return { sql: `select pc.id from dtb_product_class pc where pc.product_code = any(string_to_array($1, ','))`, params: [商品コード.join(",")] };
}
/** 商品コード（実行の印つき）が当たる商品規格の価格履歴 */
function 価格履歴の持ち主(商品コード: string[]): Owner {
  return {
    sql: `select ph.id from dtb_price_history ph join dtb_product_class pc on pc.id = ph.product_class_id where pc.product_code = any(string_to_array($1, ','))`,
    params: [商品コード.join(",")],
  };
}
/** 商品コード（実行の印つき）の規格を持つ商品 */
function 商品の持ち主(商品コード: string): Owner {
  return { sql: `select distinct pc.product_id from dtb_product_class pc where pc.product_code = $1`, params: [商品コード] };
}

// ---- 書き足し（E2E の行だけ） ----

/** 商品規格の販売価格を書き換える（画面の登録では、セールでない規格の販売価格は基準価格と同じになる） */
export function 販売価格を書き足す(what: string, 規格: { 商品規格ID: string; 商品コード: string }[], 販売価格: number): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: 規格.map((k) => k.商品規格ID), set: { price02: 販売価格 }, owner: 規格の持ち主(規格.map((k) => k.商品コード)) });
}

/** 商品規格の価格履歴を0件にする（画面の登録で、登録したときの価格履歴ができる） */
export function 価格履歴を消す(what: string, 規格: { 商品規格ID: string; 商品コード: string }[]): number {
  const ids = query(`select ph.id from dtb_price_history ph where ph.product_class_id = any(string_to_array($1, ',')::int[])`, [規格.map((k) => k.商品規格ID).join(",")]).map((r) => String(r.id));
  if (ids.length === 0) return 0;
  deleteOwnRows(what, { table: "dtb_price_history", key: "id", ids, owner: 価格履歴の持ち主(規格.map((k) => k.商品コード)) });
  return ids.length;
}

/** 商品を削除済み（公開状態「廃止」）にする（画面の商品マスターの削除は商品を消すので、削除済みの商品が残る状態を作れない） */
export function 商品を廃止にする(what: string, 商品ID: string, 商品コード: string): void {
  updateOwnRows(what, { table: "dtb_product", key: "id", ids: [商品ID], set: { product_status_id: 3 }, owner: 商品の持ち主(商品コード) });
}

// ---- 確かめ（参照だけ） ----

export type 価格履歴 = {
  変更前販売価格: string; 販売価格: string; 変更前買取価格: string; 買取価格: string;
  変更前基準価格: string; 基準価格: string; 登録者ID: string;
};

const num = (v: string | null) => (v === null || v === undefined ? "" : String(Number(v)));

/** 商品規格の価格履歴（古い順） */
export function 価格履歴の行(商品規格ID: string): 価格履歴[] {
  return query(
    `select ph.old_sell_price, ph.sell_price, ph.old_buy_price, ph.buy_price, ph.old_standard_price, ph.standard_price, ph.member_id
       from dtb_price_history ph where ph.product_class_id = $1 order by ph.id`, [商品規格ID],
  ).map((r) => ({
    変更前販売価格: num(r.old_sell_price), 販売価格: num(r.sell_price), 変更前買取価格: num(r.old_buy_price), 買取価格: num(r.buy_price),
    変更前基準価格: num(r.old_standard_price), 基準価格: num(r.standard_price), 登録者ID: r.member_id ?? "",
  }));
}

/** 商品の規格（どれか）の価格履歴の件数 */
export function 商品の価格履歴の件数(商品ID: string): number {
  return Number(query(`select count(*) as n from dtb_price_history ph join dtb_product_class pc on pc.id = ph.product_class_id where pc.product_id = $1`, [商品ID])[0].n);
}

/** 基準価格変更CSV（アプリの取込種別の定数 5）の取込履歴のうち、ファイル名がちょうど fileName のもの（古い順） */
export function 取込履歴(fileName: string): { 登録者ID: string }[] {
  return query(`select h.member_id from dtb_csv_import_history h where h.csv_import_type_id = 5 and h.file_name = $1 order by h.id`, [fileName])
    .map((r) => ({ 登録者ID: r.member_id ?? "" }));
}

/** ログインIDのメンバーのID（無ければ空） */
export function メンバーID(ログインID: string): string {
  const r = query(`select m.id from dtb_member m where m.login_id = $1`, [ログインID]);
  return r.length ? String(r[0].id) : "";
}

/** 商品の公開状態の名前（公開・非公開・廃止） */
export function 商品の公開状態(商品ID: string): string {
  const r = query(`select s.name from dtb_product p join mtb_product_status s on s.id = p.product_status_id where p.id = $1`, [商品ID]);
  return r.length ? String(r[0].name) : "";
}
