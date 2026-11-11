/**
 * M03-31 セール用価格変更CSV登録の続き（-x）の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。呼ぶ側には業務の言葉の関数名で見せる。
 * 書き足すのは、画面（グッズ商品CSV登録・商品規格の登録）で作った E2E の商品規格の、画面で作れない状態（規格の状態 SP）だけ。
 * 持ち主の確かめは「商品コード（実行の印つき）が当たる商品規格」。販売価格・価格履歴の0件・廃止は db/m03_30_x.ts の書き足しを使う。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

/** 商品コード（実行の印つき）が当たる商品規格 */
function 規格の持ち主(商品コード: string[]): Owner {
  return { sql: `select pc.id from dtb_product_class pc where pc.product_code = any(string_to_array($1, ','))`, params: [商品コード.join(",")] };
}

/** 状態の略称（NM・SP など）の番号 */
function 状態の番号(略称: string): number {
  const r = query(`select c.id from mtb_card_condition c where c.code = $1`, [略称]);
  if (r.length !== 1) throw new Error(`状態の略称 ${略称} が状態のマスタに1件でない（${r.length} 件）`);
  return Number(r[0].id);
}

/** 商品規格の状態を SP にする（グッズ商品CSV登録・商品規格の登録で作った規格。シード表「規格の状態（SP）は画面で指定できないためDBへ直接設定する」） */
export function 状態をSPにする(what: string, 規格: { 商品規格ID: string; 商品コード: string }[]): void {
  updateOwnRows(what, {
    table: "dtb_product_class", key: "id", ids: 規格.map((k) => k.商品規格ID),
    set: { card_condition_id: 状態の番号("SP") }, owner: 規格の持ち主(規格.map((k) => k.商品コード)),
  });
}

// ---- 確かめ（参照だけ） ----

/** 商品規格の状態の略称（NM・SP など） */
export function 規格の状態(商品規格ID: string): string {
  const r = query(`select c.code from dtb_product_class pc join mtb_card_condition c on c.id = pc.card_condition_id where pc.id = $1`, [商品規格ID]);
  return r.length ? String(r[0].code) : "";
}

/** 言語の番号が言語のマスタにあるか */
export function 言語がある(言語ID: string): boolean {
  return query(`select l.id from mtb_language l where l.id = $1`, [言語ID]).length > 0;
}

/** 商品の割引率・買取減額率（未設定は空） */
export function 商品の割引の設定(商品ID: string): { 割引率: string; 買取減額率: string } {
  const r = query(`select p.discount_id, p.buy_discount_id from dtb_product p where p.id = $1`, [商品ID]);
  if (!r.length) throw new Error(`商品ID ${商品ID} が無い`);
  return { 割引率: r[0].discount_id ?? "", 買取減額率: r[0].buy_discount_id ?? "" };
}
