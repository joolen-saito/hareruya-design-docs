/**
 * F06-04 パスワード再発行の続き（-b）の DB 確認と、E2E が作った会員の行への書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * - 照会は参照だけ（lib/db.ts）。
 * - 書き足すのは、画面（フロントの会員登録）で作った E2E の会員（メールアドレスの前半に実行の印）の行だけ
 *   （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts の窓口を通す）。
 *   画面で作れない状態（リセットキーと有効期限・仮会員や退会済みのままメールアドレスを保つ状態・パスワードと同じメールアドレス・
 *   形式不正のメールアドレス）だけを書く。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** 持ち主の確かめ: メールアドレスの前半の末尾に実行の印がある会員（フロントの会員登録で作った E2E の会員） */
const 自分の会員 = { sql: `select c.id from dtb_customer c where c.email like '%-' || $1 || '@example.test'`, params: [RUN_MARK] };

export type 会員の状態 = "仮会員" | "本会員" | "退会";

/**
 * E2E の会員の行に、リセットキー・有効期限・会員の状態・メールアドレスを書く（渡したものだけ）。
 * 有効期限は「YYYY-MM-DD HH:MM:SS」の壁時計の値（アプリが保存する形と同じ）。
 * 「退会」は、アプリのマイページの退会が残す状態のうちメールアドレスの書き換えだけを除いたもの（削除の印を付け、会員の状態は空。
 * 開発環境の会員の状態のマスタに「退会」の行が無く、アプリの退会は会員の状態を空にして保存している）。
 */
export function 会員の行に書く(what: string, 会員ID: string, v: { リセットキー?: string; 有効期限?: string; 状態?: 会員の状態; メールアドレス?: string }): void {
  const set: Record<string, string | number | null> = {};
  if (v.リセットキー !== undefined) set.reset_key = v.リセットキー;
  if (v.有効期限 !== undefined) set.reset_expire = v.有効期限;
  if (v.状態 === "仮会員") set.customer_status_id = 1;
  if (v.状態 === "本会員") set.customer_status_id = 2;
  if (v.状態 === "退会") { set.customer_status_id = null; set.del_flg = 1; }
  if (v.メールアドレス !== undefined) set.email = v.メールアドレス;
  updateOwnRows(what, { table: "dtb_customer", key: "id", ids: [会員ID], set, owner: 自分の会員 });
}

/** 会員の保存パスワード（暗号化された値）。会員が無ければ null */
export function 保存パスワード(会員ID: string): string | null {
  const r = query(`select c.password from dtb_customer c where c.id = $1::int`, [会員ID]);
  return r.length === 1 ? (r[0].password ?? null) : null;
}

/** 会員のリセットキー（未設定なら null）。会員が無ければ undefined */
export function リセットキー(会員ID: string): string | null | undefined {
  const r = query(`select c.reset_key from dtb_customer c where c.id = $1::int`, [会員ID]);
  return r.length === 1 ? (r[0].reset_key ?? null) : undefined;
}

/** リセットキーを持つ会員の数（削除の印・会員の状態を問わない） */
export function リセットキーを持つ会員の数(キー: string): number {
  return Number(query(`select count(*) as n from dtb_customer c where c.reset_key = $1`, [キー])[0]?.n ?? 0);
}

/** 会員の状態の名前（空なら空文字）・削除の印・メールアドレス */
export function 会員の状態とメール(会員ID: string): { 状態: string; 削除: boolean; メールアドレス: string } | null {
  const r = query(
    `select coalesce(s.name, '') as 状態, c.del_flg::text as 削除, c.email from dtb_customer c left join mtb_customer_status s on s.id = c.customer_status_id where c.id = $1::int`, [会員ID]);
  return r.length === 1 ? { 状態: r[0].状態 ?? "", 削除: r[0].削除 === "1", メールアドレス: r[0].email ?? "" } : null;
}
