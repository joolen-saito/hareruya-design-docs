/**
 * M04-32 在庫編集承認一覧の、E2E が作った承認の行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい。画面で作れない状態だけ」。lib/db_write.ts の窓口）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足すのは、承認状態「スマレジ連携失敗」だけ（スマレジの試験環境で連携を失敗させる手段が画面に無い）。
 * 持ち主の確かめは「商品コードの末尾に実行の印を持つ商品規格の、在庫編集の承認」。人が作った行・前の実行の行は、印が違うので書き換えない。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 承認の登録元 = { 在庫編集: 1, 在庫変更CSV登録: 3 } as const;
const スマレジ連携失敗 = 4;

const 自分の承認の持ち主の確かめ = (列: "l.id" | "a.id") => ({
  sql: `select ${列} from dtb_stock_approval_list l
          join dtb_stock_edit_approval a on a.id = l.history_source_id
          join dtb_stock_edit_approval_detail d on d.stock_edit_approval_id = a.id
          join dtb_product_stock ps on ps.id = d.product_stock_id
          join dtb_product_class pc on pc.id = ps.product_class_id
         where pc.product_code like '%-' || $1`,
  params: [RUN_MARK],
});

/** 商品コードの商品規格を対象にした、未承認の承認（在庫編集承認一覧の行と、その元の承認情報）の番号 */
export function 未承認の承認の番号(商品コード: string, 承認対象: keyof typeof 承認の登録元): { 一覧の行: string[]; 承認情報: string[] } {
  const r = query(
    `select distinct l.id::text as list_id, l.history_source_id::text as src
       from dtb_stock_approval_list l
       join dtb_stock_edit_approval_detail d on d.stock_edit_approval_id = l.history_source_id
       join dtb_product_stock ps on ps.id = d.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and l.history_source_type_id = $2::int and l.approval_status = 1`, [商品コード, 承認の登録元[承認対象]]);
  return { 一覧の行: r.map((x) => String(x.list_id)), 承認情報: r.map((x) => String(x.src)) };
}

/** 商品コードの未承認の承認（承認対象の種類を指定）を、承認状態「スマレジ連携失敗」にする。ちょうど1件でなければ止める */
export function スマレジ連携失敗にする(what: string, 商品コード: string, 承認対象: keyof typeof 承認の登録元): void {
  const n = 未承認の承認の番号(商品コード, 承認対象);
  if (n.一覧の行.length !== 1) throw new Error(`${what}: 商品コード ${商品コード} の未承認の承認（${承認対象}）が ${n.一覧の行.length} 件（1件のはず）`);
  updateOwnRows(`${what}（承認一覧の行）`, { table: "dtb_stock_approval_list", key: "id", ids: n.一覧の行, set: { approval_status: スマレジ連携失敗 }, owner: 自分の承認の持ち主の確かめ("l.id") });
  updateOwnRows(`${what}（承認情報）`, { table: "dtb_stock_edit_approval", key: "id", ids: n.承認情報, set: { approval_status: スマレジ連携失敗 }, owner: 自分の承認の持ち主の確かめ("a.id") });
}

/** 商品コードの承認の、承認状態（一覧の行・承認情報の両方）の数字を読む */
export function 承認状態の数字(商品コード: string, 承認対象: keyof typeof 承認の登録元): number[] {
  return query(
    `select distinct l.approval_status as s from dtb_stock_approval_list l
       join dtb_stock_edit_approval_detail d on d.stock_edit_approval_id = l.history_source_id
       join dtb_product_stock ps on ps.id = d.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and l.history_source_type_id = $2::int`, [商品コード, 承認の登録元[承認対象]]).map((x) => Number(x.s));
}
