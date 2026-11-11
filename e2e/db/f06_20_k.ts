// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F06-20 お届け先（配送先）の保存結果の確認（読むだけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query, Row } from "../lib/db";

/** 配送先の状態（行が無ければ undefined）。削除済み＝削除の印が付いている（行は残る） */
export function 配送先の状態(配送先ID: string): { 削除済み: boolean; 配送先名称: string; 会員ID: string } | undefined {
  const r: Row | undefined = query(
    "select a.del_flg as 削除, a.address_name as 名称, a.customer_id as 会員 from dtb_customer_address a where a.id = $1::int", [配送先ID])[0];
  return r ? { 削除済み: r.削除 !== "0", 配送先名称: r.名称 ?? "", 会員ID: r.会員 ?? "" } : undefined;
}

/** 会員の、削除済みではない配送先の件数（会員登録で作られる既定の配送先を含む。上限の判定に使われる件数） */
export function 会員の配送先の件数(会員ID: string): number {
  return Number(query("select count(*) as n from dtb_customer_address a where a.customer_id = $1::int and a.del_flg = 0", [会員ID])[0]?.n ?? "0");
}

/** 会員の既定の配送先の番号（画面の一覧には出ないので、DBの参照で控える） */
export function 既定の配送先ID(会員ID: string): string | null {
  return query("select a.id as id from dtb_customer_address a where a.customer_id = $1::int and a.del_flg = 0 and a.default_flg = true order by a.id limit 1", [会員ID])[0]?.id ?? null;
}
