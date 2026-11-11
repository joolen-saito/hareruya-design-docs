/**
 * M03-32 高額商品価格変更CSV登録の続き（-x）の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。呼ぶ側には業務の言葉の関数名で見せる。
 * 書き足すのは、画面（グッズ商品CSV登録・商品規格の登録）で作った E2E の商品規格の、画面で作れない状態（更新日時）だけ。
 * 販売価格・価格履歴の0件は db/m03_30_x.ts の書き足しを使う。持ち主の確かめは「商品コード（実行の印つき）が当たる商品規格」。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

/** 商品コード（実行の印つき）が当たる商品規格 */
function 規格の持ち主(商品コード: string[]): Owner {
  return { sql: `select pc.id from dtb_product_class pc where pc.product_code = any(string_to_array($1, ','))`, params: [商品コード.join(",")] };
}

/** 商品規格の更新日時を書き換える（画面で登録すると現在日時になる）。日時は「2026-09-01 00:00:00+09」の形 */
export function 更新日時を書き足す(what: string, 規格: { 商品規格ID: string; 商品コード: string }, 日時: string): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格.商品規格ID], set: { update_date: 日時 }, owner: 規格の持ち主([規格.商品コード]) });
}

// ---- 確かめ（参照だけ） ----

/** 商品規格の更新日時（日本時間の「YYYY-MM-DD HH:MM:SS」） */
export function 規格の更新日時(商品規格ID: string): string {
  const r = query(`select to_char(pc.update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as d from dtb_product_class pc where pc.id = $1`, [商品規格ID]);
  return r.length ? String(r[0].d ?? "") : "";
}

/** 商品コードがちょうど一致する商品規格（公開状態と、属する商品の公開状態の名前つき） */
export function 商品コードの規格(商品コード: string): { 商品規格ID: string; 規格の公開状態: string; 商品の公開状態: string }[] {
  return query(
    `select pc.id, cs.name as class_status, ps.name as product_status
       from dtb_product_class pc
       join dtb_product p on p.id = pc.product_id
       left join mtb_product_status cs on cs.id = pc.product_status_id
       left join mtb_product_status ps on ps.id = p.product_status_id
      where pc.product_code = $1 order by pc.id`, [商品コード],
  ).map((r) => ({ 商品規格ID: String(r.id), 規格の公開状態: r.class_status ?? "", 商品の公開状態: r.product_status ?? "" }));
}
