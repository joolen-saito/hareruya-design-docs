/**
 * M03-10 買取・販売価格一括編集の続き（-x）の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。呼ぶ側には業務の言葉の関数名で見せる。
 * 書き足すのは、画面（グッズ商品CSV登録・商品規格の登録）で作った E2E の商品規格の、画面で作れない状態だけ:
 * 価格履歴の件数（024 の2件）・規格の削除済み（025・026 の手順）。価格履歴の0件は db/m03_30_x.ts の 価格履歴を消す を使う。
 * 持ち主の確かめは「商品コード（実行の印つき）が当たる商品規格」。
 */
import { query } from "../lib/db";
import { insertOwnRows, Owner, updateOwnRows } from "../lib/db_write";

/** 商品コード（実行の印つき）が当たる商品規格 */
function 規格の持ち主(商品コード: string[]): Owner {
  return { sql: `select pc.id from dtb_product_class pc where pc.product_code = any(string_to_array($1, ','))`, params: [商品コード.join(",")] };
}

const num = (v: string | null | undefined) => (v === null || v === undefined ? "" : String(Number(v)));

// ---- 書き足し（E2E の行だけ） ----

/**
 * 商品規格の価格履歴を n 件足す（024 のシード表「価格履歴ID 310024901・310024902 の2件」。価格履歴IDは画面でも DB の採番でも指定しない読み替え）。
 * 値は規格のいまの価格（変更前と変更後が同じ）で、登録者は空、作成日時は今。
 */
export function 価格履歴を足す(what: string, 規格: { 商品規格ID: string; 商品コード: string }, n: number): void {
  const r = query(`select pc.price02, pc.buy_price, pc.standard_price from dtb_product_class pc where pc.id = $1`, [規格.商品規格ID])[0];
  if (!r) throw new Error(`${what}: 商品規格ID ${規格.商品規格ID} が無い`);
  const now = new Date().toISOString();
  const rows = Array.from({ length: n }, () => ({
    product_class_id: 規格.商品規格ID, member_id: null, sell_price: num(r.price02), buy_price: num(r.buy_price), standard_price: num(r.standard_price),
    old_sell_price: num(r.price02), old_buy_price: num(r.buy_price), old_standard_price: num(r.standard_price), create_date: now,
  }));
  insertOwnRows(what, { table: "dtb_price_history", parentColumn: "product_class_id", rows, owner: 規格の持ち主([規格.商品コード]) });
}

/** 商品規格を削除済みにする（025・026 の手順3「DBで NM 規格を削除済みに変更する」。アプリの商品規格の削除と同じ印） */
export function 規格を削除済みにする(what: string, 規格: { 商品規格ID: string; 商品コード: string }): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格.商品規格ID], set: { visible: false }, owner: 規格の持ち主([規格.商品コード]) });
}

// ---- 確かめ（参照だけ） ----

export type 規格の値 = { 買取価格: string; 基準価格: string; 削除済み: boolean };
/** 商品規格の買取価格・基準価格・削除済みか */
export function 規格の値(商品規格ID: string): 規格の値 {
  const r = query(`select pc.buy_price, pc.standard_price, pc.visible::text as v from dtb_product_class pc where pc.id = $1`, [商品規格ID])[0];
  if (!r) throw new Error(`商品規格ID ${商品規格ID} が無い`);
  return { 買取価格: num(r.buy_price), 基準価格: num(r.standard_price), 削除済み: r.v === "false" };
}

/** 商品規格の価格履歴の件数 */
export function 価格履歴の件数(商品規格ID: string): number {
  return Number(query(`select count(*) as n from dtb_price_history ph where ph.product_class_id = $1`, [商品規格ID])[0].n);
}

/** 商品規格の在庫数（全店舗・全在庫場所の合計） */
export function 規格の在庫数(商品規格ID: string): number {
  return Number(query(`select coalesce(sum(ps.stock), 0) as n from dtb_product_stock ps where ps.product_class_id = $1`, [商品規格ID])[0].n);
}

/** 在庫編集承認一覧の行の最大ID（入庫の申請の前に控え、今回の申請を見分ける） */
export function 在庫承認の最大ID(): number {
  return Number(query(`select coalesce(max(a.id), 0) as m from dtb_stock_approval_list a`)[0].m);
}

/** 言語の名前（日本語の名前）。言語ID 1・2 があるかの確かめに使う */
export function 言語の名前(言語ID: string): string {
  const r = query(`select l.name_jp from mtb_language l where l.id = $1`, [言語ID]);
  return r.length ? String(r[0].name_jp) : "";
}

/** 買取価格対応表に、入力NM価格の行があるか（あれば一括編集で使える値。行の中身は全員が使うマスタなので見るだけ） */
export function 買取価格対応表にある(入力NM価格: number): boolean {
  return Number(query(`select count(*) as n from mtb_buy_price_list b where b.nm_price = $1`, [入力NM価格])[0].n) > 0;
}
