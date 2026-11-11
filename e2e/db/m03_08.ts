/**
 * M03-08 商品規格一覧の DB の照会と、E2E が作った商品規格だけへの書き足し（lib/db_write.ts）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは、画面で作れない状態（言語未設定・状態未設定・商品規格0件）だけ。持ち主の確かめは「商品コードがこの実行の印で終わる商品規格」。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 持ち主 = () => ({ sql: `select id from dtb_product_class where product_code like $1`, params: [`%-${RUN_MARK}`] });

/** 商品規格の言語を未設定にする（画面の言語の欄は必須で、未設定を選べない） */
export function 規格の言語を外す(what: string, 商品規格ID: string[]): void {
  updateOwnRows(`${what}: 言語未設定`, { table: "dtb_product_class", key: "id", ids: 商品規格ID, set: { language_id: null }, owner: 持ち主() });
}
/** 商品規格の状態を未設定にする（画面の状態の欄は必須で、未設定を選べない） */
export function 規格の状態を外す(what: string, 商品規格ID: string[]): void {
  updateOwnRows(`${what}: 状態未設定`, { table: "dtb_product_class", key: "id", ids: 商品規格ID, set: { card_condition_id: null }, owner: 持ち主() });
}
/** 商品規格を削除済みにする（アプリの商品規格の削除と同じく、公開ステータスを廃止にして表示の印を外す。行は消さない） */
export function 規格を削除済みにする(what: string, 商品規格ID: string[]): void {
  updateOwnRows(`${what}: 削除済み`, { table: "dtb_product_class", key: "id", ids: 商品規格ID, set: { product_status_id: 3, visible: false }, owner: 持ち主() });
}

export type 規格の状態 = { 削除済み: boolean; 言語あり: boolean; 状態あり: boolean };
/** 商品規格の削除状態と、言語・状態が設定されているか */
export function 規格の状態(商品規格ID: string): 規格の状態 | null {
  const r = query(`select pc.visible::text as v, (pc.language_id is not null)::text as l, (pc.card_condition_id is not null)::text as c from dtb_product_class pc where pc.id = $1`, [商品規格ID])[0];
  if (!r) return null;
  const b = (x: unknown) => ["t", "true"].includes(String(x));
  return { 削除済み: !b(r.v), 言語あり: b(r.l), 状態あり: b(r.c) };
}

/** 商品IDの商品が登録されているか */
export function 商品がある(商品ID: string): boolean {
  return Number(query(`select count(*) as n from dtb_product where id = $1::int`, [商品ID])[0]?.n ?? 0) > 0;
}

/** 商品コードの商品規格（ほかの方のものも含む）の件数 */
export function 商品コードの規格の数(商品コード: string): number {
  return Number(query(`select count(*) as n from dtb_product_class where product_code = $1`, [商品コード])[0]?.n ?? 0);
}

/** 商品の削除されていない商品規格の件数 */
export function 削除されていない規格の数(商品ID: string): number {
  return Number(query(`select count(*) as n from dtb_product_class where product_id = $1::int and visible`, [商品ID])[0]?.n ?? 0);
}
