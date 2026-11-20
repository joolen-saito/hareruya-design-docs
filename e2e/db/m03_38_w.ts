/**
 * M03-38 商品公開CSV登録の、取込前後の確かめと、E2E が作った商品への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足すのは、画面で作れない状態（削除済みの商品）だけ。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 自分の商品 = { sql: `select p.id from dtb_product p where exists (select 1 from dtb_product_class pc where pc.product_id = p.id and pc.product_code like '%-' || $1)`, params: [RUN_MARK] };

export type 公開状態 = { 商品公開ステータス: number; 支店の商品公開ステータス: number; 削除済み: boolean };

/** 商品IDの公開状態。商品公開ステータスは、アプリの値（1=公開・2=非公開・3=廃止）を、正本の読み方（公開=1・それ以外=0）にして返す */
export function 商品の公開状態(商品ID: string): 公開状態 {
  const r = query(`select p.product_status_id as s, p.is_branch_published as b from dtb_product p where p.id = $1`, [商品ID]);
  if (r.length !== 1) throw new Error(`商品ID ${商品ID} の商品が ${r.length} 件`);
  const s = Number(r[0].s);
  return { 商品公開ステータス: s === 1 ? 1 : 0, 支店の商品公開ステータス: ["t", "true", "1"].includes(String(r[0].b).toLowerCase()) ? 1 : 0, 削除済み: s === 3 };
}

/** 商品公開CSV登録の取込履歴の件数（ファイル名が一致するもの） */
export function 商品公開CSVの取込履歴件数(ファイル名: string): number {
  return Number(query(`select count(*) as n from dtb_csv_import_history h where h.csv_import_type_id = 14 and h.file_name = $1`, [ファイル名])[0]?.n ?? 0);
}

/** 画面で作った E2E の商品を、削除済み（商品公開ステータス「廃止」）にする */
export function 商品を削除済みにする(what: string, 商品ID: string): void {
  updateOwnRows(what, { table: "dtb_product", key: "id", ids: [商品ID], set: { product_status_id: 3 }, owner: 自分の商品 });
}

/** 商品IDの行があるか */
export function 商品IDの行がある(商品ID: string): boolean {
  return query(`select p.id from dtb_product p where p.id = $1`, [商品ID]).length > 0;
}
